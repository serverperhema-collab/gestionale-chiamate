import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const standardReviews = await prisma.contact.findMany({
      where: {
        reviewRequestedAt: { not: null }
      },
      select: {
        id: true,
        name: true,
        cap: true,
        originalPhone: true,
        address: true,
        reviewRequestedAt: true,
        reviewNote: true
      }
    });

    const deroghe = await prisma.appointment.findMany({
      where: {
        isDeroga: true,
        isApproved: false,
        status: "PENDING"
      },
      include: {
        contact: {
          select: { name: true, cap: true, originalPhone: true, address: true }
        },
        commerciale: { select: { name: true } },
        operator: { select: { name: true } }
      }
    });

    const gestioneSeparata = await prisma.gestioneSeparataRequest.findMany({
      where: {
        isResolved: false
      },
      include: {
        contact: {
          select: { name: true, cap: true, originalPhone: true, address: true }
        }
      }
    });

    const combined = [
      ...standardReviews.map(r => ({ ...r, type: 'REVIEW', date: r.reviewRequestedAt })),
      ...deroghe.map(d => ({
        id: d.id,
        contactId: d.contactId,
        name: d.contact?.name || "Sconosciuto",
        cap: d.contact?.cap,
        originalPhone: d.contact?.originalPhone,
        address: d.contact?.address,
        reviewRequestedAt: d.createdAt,
        reviewNote: `Richiesta appuntamento in deroga il ${new Date(d.date).toLocaleString('it-IT')} da ${d.commerciale?.name || d.operator?.name || 'Utente'}. Data/Ora appuntamento: ${new Date(d.date).toLocaleString('it-IT')}. Note: ${d.clientNeeds}`,
        type: 'DEROGA',
        date: d.createdAt
      })),
      ...gestioneSeparata.map(g => ({
        id: g.id,
        contactId: g.contactId,
        name: g.contact?.name || "Sconosciuto",
        cap: g.contact?.cap,
        originalPhone: g.contact?.originalPhone,
        address: g.contact?.address,
        reviewRequestedAt: g.createdAt,
        reviewNote: g.reason,
        type: 'GESTIONE_SEPARATA',
        date: g.createdAt
      }))
    ];

    combined.sort((a, b) => new Date(a.date || new Date()).getTime() - new Date(b.date || new Date()).getTime());

    return NextResponse.json({ reviews: combined });
  } catch (error) {
    console.error("GET tl reviews error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, newDate } = body;
    if (!id || !action) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    let contact = null;
    if (!action.startsWith("DEROGA_")) {
      contact = await prisma.contact.findUnique({ where: { id } });
      if (!contact) {
        return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
      }
    }

    const tlId = (session.user as any).id;

    if (action === "RESTORE") {
      // Ripristina nel calderone (rimuovi note di revisione e hiddenUntil)
      await prisma.$transaction([
        prisma.contact.update({
          where: { id },
          data: {
            reviewRequestedAt: null,
            reviewNote: null,
            hiddenUntil: null
          }
        }),
        prisma.activityLog.create({
          data: {
            userId: tlId,
            contactId: id,
            action: "CONTACT_REVIEW_RESOLVED",
            details: "Contatto ripristinato nel calderone dopo revisione TL"
          }
        })
      ]);
    } else if (action === "DEROGA_ACCEPT") {
      const appt = await prisma.appointment.update({
        where: { id },
        data: { isApproved: true, status: "CONFIRMED" }
      });
      if (appt.commercialeId) {
        await prisma.notification.create({
          data: {
            userId: appt.commercialeId,
            title: "Deroga Approvata",
            message: `La tua richiesta di appuntamento fuori agenda per il ${new Date(appt.date).toLocaleString('it-IT')} è stata approvata.`,
            appointmentId: appt.id,
            contactId: appt.contactId
          }
        });
      }
      return NextResponse.json({ success: true });
    } else if (action === "DEROGA_REJECT") {
      const appt = await prisma.appointment.findUnique({ where: { id } });
      if (appt) {
        await prisma.$transaction(async (tx) => {
          await tx.appointment.update({
            where: { id },
            data: { status: "CANCELLED" }
          });
          // Se commercialeId esiste (significa che è un Commerciale che si stava auto-fissando), lo rimandiamo in FOLLOW_UP
          if (appt.commercialeId) {
            await tx.contact.update({
              where: { id: appt.contactId },
              data: {
                assignedToId: appt.commercialeId,
                hiddenUntil: null
              }
            });
            await tx.notification.create({
              data: {
                userId: appt.commercialeId,
                title: "Deroga Rifiutata",
                message: `La tua richiesta di deroga è stata rifiutata dal TL. Il contatto è tornato nelle tue Trattative In Corso.`,
                contactId: appt.contactId
              }
            });
          }
        });
      }
      return NextResponse.json({ success: true });
    } else if (action === "DEROGA_RESCHEDULE") {
      if (!newDate) return NextResponse.json({ error: "newDate missing" }, { status: 400 });
      const appt = await prisma.appointment.update({
        where: { id },
        data: { 
          isApproved: true, 
          status: "CONFIRMED",
          date: new Date(newDate)
        }
      });
      if (appt.commercialeId) {
        await prisma.notification.create({
          data: {
            userId: appt.commercialeId,
            title: "Deroga Spostata e Approvata",
            message: `La tua deroga è stata spostata dal TL al ${new Date(newDate).toLocaleString('it-IT')} e confermata.`,
            appointmentId: appt.id,
            contactId: appt.contactId
          }
        });
      }
      return NextResponse.json({ success: true });
    } else if (action === "BLACKLIST") {
      // Elimina definitivamente e sposta nel cestino permanente (blacklist)
      await prisma.$transaction([
        prisma.contact.update({
          where: { id },
          data: {
            reviewRequestedAt: null,
            reviewNote: null,
            isKo: true,
            blacklisted: true,
            blacklistReason: contact?.reviewNote || "Eliminato dopo revisione TL",
            hiddenUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Nascosto per 1 anno (e filtrato da blacklist)
          }
        }),
        prisma.activityLog.create({
          data: {
            userId: tlId,
            contactId: id,
            action: "CONTACT_REVIEW_BLACKLISTED",
            details: `Contatto inserito in Blacklist dopo revisione TL. Motivo: ${contact?.reviewNote || "N/A"}`
          }
        })
      ]);
    } else {
      return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH tl reviews error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}