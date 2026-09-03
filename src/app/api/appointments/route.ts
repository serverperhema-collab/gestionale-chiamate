import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { eventEmitter } from "@/lib/eventEmitter";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OPERATORE", "COMMERCIALE", "TEAM_LEADER"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const userName = (session.user as any).name || "Utente";
    const body = await req.json();
    const { 
      contactId, 
      date, 
      isDeroga, 
      referentName, 
      referentRole, 
      phone, 
      email, 
      clientNeeds,
      zoneAgendaId,
      isSecondAppt
    } = body;

    if (!contactId || !date || !referentName || !referentRole || !phone || !clientNeeds) {
      return NextResponse.json({ error: "Dati obbligatori mancanti" }, { status: 400 });
    }

    // 1. Controlla se il contatto esiste ed è disponibile
    const contact = await prisma.contact.findUnique({ 
      where: { id: contactId }, 
      include: { 
        assignedTo: true,
        appointments: {
          orderBy: { createdAt: 'asc' },
          take: 1
        }
      } 
    });
    if (!contact) {
      return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
    }

    if (isDeroga && role === "OPERATORE") {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const hoursAgo = new Date(Date.now() - (user!.maxDerogheHours * 60 * 60 * 1000));
      const recentDerogheCount = await prisma.appointment.count({
        where: {
          operatorId: userId,
          isDeroga: true,
          createdAt: { gte: hoursAgo }
        }
      });
      if (recentDerogheCount >= user!.maxDeroghe) {
        return NextResponse.json({ 
          error: `Limite raggiunto: puoi inserire massimo ${user!.maxDeroghe} appuntamenti in deroga ogni ${user!.maxDerogheHours} ore.` 
        }, { status: 403 });
      }
    }

    // Recupera l'agenda per vedere se ha già un commerciale assegnato
    let assignedCommercialeId = null;
    if (zoneAgendaId) {
      const agenda = await prisma.zoneAgenda.findUnique({ where: { id: zoneAgendaId } });
      if (agenda && agenda.commercialeId) {
        assignedCommercialeId = agenda.commercialeId;
      }
    }

    // Crea l'appuntamento
    const appointment = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.create({
        data: {
          contactId,
          operatorId: role === "OPERATORE" ? userId : (contact.appointments[0]?.operatorId || userId),
          commercialeId: role === "COMMERCIALE" ? userId : assignedCommercialeId,
          zoneAgendaId, // ID esplicito dell'agenda
          date: new Date(date),
          isDeroga,
          isApproved: !isDeroga, // Se è deroga, deve essere approvato dalla TL
          referentName,
          referentRole,
          phone,
          email,
          clientNeeds,
          isSecondAppt: isSecondAppt || false
        }
      });

      // Se la chiamata provine da una trattativa, dobbiamo chiuderla (abbandonarla) 
      // o segnarla come convertita. Dato che non abbiamo un campo convertito, possiamo cancellarla
      // o lasciarla approved ma legata al fatto che il contatto ora ha un appuntamento.
      // Il contatto riceve un hiddenUntil tra un anno (come da logica esiti).
      await tx.contact.update({
        where: { id: contactId },
        data: {
          hiddenUntil: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000), // 10 anni (Invisibile al calderone)
          assignedToId: null,
          reviewRequestedAt: null, // Rimuovi dalla coda TL se era in revisione
          reviewNote: null
        }
      });

      // Se c'è una trattativa attiva su questo contatto, archiviala
      await tx.negotiation.updateMany({
        where: { contactId, isAbandoned: false },
        data: { isAbandoned: true } // "Consumata"
      });

      // Log dell'azione
      await tx.callLog.create({
        data: {
          contactId,
          userId: userId,
          outcome: "APPOINTMENT",
          notes: `Fissato appuntamento per il ${new Date(date).toLocaleString()} (Deroga: ${isDeroga})`
        }
      });

      // Notifica il commerciale se il contatto era assegnato a lui
      if (contact.assignedTo?.role === "COMMERCIALE" && role === "OPERATORE") {
        await tx.notification.create({
          data: {
            userId: contact.assignedToId!,
            title: "Richiamo Lavorato",
            message: `L'operatore ${userName} ha fissato un appuntamento per il tuo richiamo "${contact.name}".`,
            appointmentId: appt.id,
            contactId: contact.id
          }
        });
      }

      return appt;
    });

    eventEmitter.emit("tl-alert", { 
      type: "APPOINTMENT", 
      operatorName: userName, 
      reason: isDeroga ? "Nuovo appuntamento (Deroga) fissato. Richiede approvazione!" : "Nuovo appuntamento fissato!" 
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error("POST appointment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
