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
      where: { reviewRequestedAt: { not: null } },
      select: { id: true, name: true, cap: true, originalPhone: true, address: true, reviewRequestedAt: true, reviewNote: true }
    });

    const deroghe = await prisma.appointment.findMany({
      where: { isDeroga: true, isApproved: false, status: "PENDING" },
      include: {
        contact: { select: { name: true, cap: true, originalPhone: true, address: true } },
        commerciale: { select: { name: true } },
        operator: { select: { name: true } }
      }
    });

    const gestioneSeparata = await prisma.gestioneSeparataRequest.findMany({
      where: { isResolved: false },
      include: {
        contact: { select: { name: true, cap: true, originalPhone: true, address: true } }
      }
    });

    // NUOVO SISTEMA: ST con derogaStatus = PENDING
    const stDeroghe = await prisma.trattativaSheet.findMany({
      where: { derogaStatus: "PENDING" },
      include: {
        contact: { select: { name: true, cap: true, originalPhone: true, address: true } },
        currentOperator: { select: { name: true } },
        currentCommerciale: { select: { name: true } }
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
        reviewNote: `Richiesta appuntamento in deroga il ${new Date(d.date).toLocaleString('it-IT')} da ${d.commerciale?.name || d.operator?.name || 'Utente'}. Note: ${d.clientNeeds}`,
        type: 'DEROGA',
        date: d.createdAt
      })),
      ...stDeroghe.map(st => ({
        id: st.id,
        isNewSystem: true,
        contactId: st.contactId,
        name: st.contact?.name || "Sconosciuto",
        cap: st.contact?.cap,
        originalPhone: st.contact?.originalPhone,
        address: st.contact?.address,
        reviewRequestedAt: st.updatedAt,
        reviewNote: `(NUOVO SISTEMA) Richiesta deroga per il ${st.nextActionDate ? new Date(st.nextActionDate).toLocaleString('it-IT') : 'N/D'} da ${st.currentCommerciale?.name || st.currentOperator?.name || 'Utente'}. Note: ${st.outcomeNotes}`,
        type: 'DEROGA',
        date: st.updatedAt
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
    const { id, action, newDate, rejectReason, isNewSystem } = body;
    if (!id || !action) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const tlId = (session.user as any).id;

    if (isNewSystem && action.startsWith("DEROGA_")) {
      const st = await prisma.trattativaSheet.findUnique({ where: { id } });
      if (!st) return NextResponse.json({ error: "ST non trovata" }, { status: 404 });

      if (action === "DEROGA_ACCEPT" || action === "DEROGA_RESCHEDULE") {
        await prisma.trattativaSheet.update({
          where: { id },
          data: {
            derogaStatus: "APPROVED",
            nextActionType: "APPUNTAMENTO",
            nextActionDate: newDate ? new Date(newDate) : st.nextActionDate,
            version: { increment: 1 }
          }
        });
        await prisma.trattativaAppointment.create({
          data: {
            trattativaId: id,
            date: newDate ? new Date(newDate) : (st.nextActionDate || new Date()),
            isPhoneAppt: true,
            commercialeId: st.currentCommercialeId,
            status: "FISSATO"
          }
        });
      } else if (action === "DEROGA_REJECT") {
        await prisma.trattativaSheet.update({
          where: { id },
          data: {
            derogaStatus: "REJECTED",
            nextActionType: "NONE",
            nextActionDate: null,
            version: { increment: 1 }
          }
        });
      }
      return NextResponse.json({ success: true });
    }

    let contact = null;
    if (!action.startsWith("DEROGA_")) {
      contact = await prisma.contact.findUnique({ where: { id } });
      if (!contact) {
        return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
      }
    }

    if (action === "RESTORE") {
      await prisma.$transaction([
        prisma.contact.update({
          where: { id },
          data: { reviewRequestedAt: null, reviewNote: null, hiddenUntil: null }
        }),
        prisma.activityLog.create({
          data: { userId: tlId, contactId: id, action: "CONTACT_REVIEW_RESOLVED", details: "Contatto ripristinato" }
        })
      ]);
    } else if (action === "DEROGA_ACCEPT") {
      await prisma.appointment.update({ where: { id }, data: { isApproved: true, status: "CONFIRMED" } });
    } else if (action === "DEROGA_REJECT") {
      await prisma.appointment.update({ where: { id }, data: { status: "CANCELLED" } });
    } else if (action === "DEROGA_RESCHEDULE") {
      await prisma.appointment.update({ where: { id }, data: { isApproved: true, status: "CONFIRMED", date: new Date(newDate) } });
    } else if (action === "BLACKLIST") {
      await prisma.$transaction([
        prisma.contact.update({
          where: { id },
          data: { reviewRequestedAt: null, reviewNote: null, isKo: true, blacklisted: true, blacklistReason: contact?.reviewNote || "Eliminato dopo revisione TL", hiddenUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
        }),
        prisma.activityLog.create({
          data: { userId: tlId, contactId: id, action: "CONTACT_REVIEW_BLACKLISTED", details: `Blacklist TL: ${contact?.reviewNote || "N/A"}` }
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