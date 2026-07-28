import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const tlId = (session.user as any).id;
    const body = await req.json();
    const { actionType, commercialeId, notes, recallDate } = body;

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 });
    }

    if (appointment.status === "CANCELLED" || appointment.status === "DA_GESTIRE_COMMERCIALE" || appointment.status === "CONFIRMED") {
      // If the action is RIMBALZA_COMMERCIALE, we might allow it from CONFIRMED? No, these are terminal states for TL action.
      // Wait, is it possible TL needs to update a CONFIRMED appointment? The UI hides the action buttons if it's confirmed.
      if (actionType.startsWith("ANNULLA_") && appointment.status === "CANCELLED") {
        return NextResponse.json({ error: "L'appuntamento è già stato annullato." }, { status: 400 });
      }
    }

    let allAgendaManaged = false;
    let targetAgendaId: string | null = null;

    await prisma.$transaction(async (tx) => {
      if (actionType === "CONFIRM") {
        await tx.appointment.update({
          where: { id },
          data: { 
            status: "CONFIRMED",
            commercialeId: commercialeId || null,
            isApproved: true,
            isDeroga: false
          }
        });
      } else if (actionType === "ANNULLA_RIMANDA_OPERATORE") {
        if (!recallDate || !notes) throw new Error("Data richiamo e note obbligatorie");
        
        await tx.appointment.update({
          where: { id },
          data: { status: "CANCELLED", tlNotes: notes }
        });
        
        await tx.contact.update({
          where: { id: appointment.contactId },
          data: { assignedToId: appointment.operatorId, hiddenUntil: null }
        });
        
        await tx.negotiation.create({
          data: {
            contactId: appointment.contactId,
            operatorId: appointment.operatorId,
            recallDate: new Date(recallDate),
            reason: notes
          }
        });

      } else if (actionType === "ANNULLA_CALDERONE") {
        if (!notes) throw new Error("Note obbligatorie");
        
        await tx.appointment.update({
          where: { id },
          data: { status: "CANCELLED", tlNotes: notes }
        });
        
        await tx.contact.update({
          where: { id: appointment.contactId },
          data: { assignedToId: null, hiddenUntil: null }
        });

      } else if (actionType === "ANNULLA_BLOCCO_PERENNE") {
        if (!notes) throw new Error("Note obbligatorie");
        
        await tx.appointment.update({
          where: { id },
          data: { status: "CANCELLED", tlNotes: notes }
        });
        
        await tx.koRecord.create({
          data: {
            contactId: appointment.contactId,
            frozenUntil: new Date("2099-12-31T23:59:59Z")
          }
        });
        
        await tx.contact.update({
          where: { id: appointment.contactId },
          data: { assignedToId: null, hiddenUntil: null }
        });

      } else if (actionType === "RIMBALZA_COMMERCIALE") {
        if (!commercialeId) throw new Error("Nessun commerciale assegnato a questo appuntamento (seleziona un'Agenda)");
        
        await tx.appointment.update({
          where: { id },
          data: { status: "DA_GESTIRE_COMMERCIALE", tlNotes: notes, commercialeId, isDeroga: false, isApproved: true }
        });

      } else if (actionType === "RICHIAMA_TL") {
        if (!notes) throw new Error("Inserisci il titolo/note per il task");
        
        await tx.appointment.update({
          where: { id },
          data: { status: "CANCELLED", tlNotes: "Preso in carico dalla TL (Richiama TL)" }
        });
        
        await tx.tlTask.create({
          data: {
            tlId: tlId,
            contactId: appointment.contactId,
            title: notes,
            recallDate: recallDate ? new Date(recallDate) : null
          }
        });
        
        await tx.contact.update({
          where: { id: appointment.contactId },
          data: { assignedToId: tlId, hiddenUntil: null }
        });

      } else {
        throw new Error("Azione non valida");
      }

      await tx.activityLog.create({
        data: {
          userId: tlId,
          contactId: appointment.contactId,
          action: "TL_APPOINTMENT_ACTION",
          details: `Azione ${actionType} eseguita sull'appuntamento ${id}${notes ? `. Motivazione: ${notes}` : ''}`
        }
      });

      // Controlliamo lo stato dell'agenda se l'appuntamento fa parte di un'agenda
      if (appointment.zoneAgendaId) {
        targetAgendaId = appointment.zoneAgendaId;
        const agendaAppts = await tx.appointment.findMany({
          where: { zoneAgendaId: targetAgendaId }
        });
        // Se non ci sono appuntamenti in stato PENDING, l'agenda è tutta gestita
        allAgendaManaged = agendaAppts.length > 0 && agendaAppts.every(a => a.status !== "PENDING");
        
        // Verifica se l'agenda non è già chiusa
        if (allAgendaManaged) {
           const agenda = await tx.zoneAgenda.findUnique({ where: { id: targetAgendaId } });
           if (agenda?.isClosed) {
             allAgendaManaged = false; // Se è già chiusa, non richiamare il popup
           }
        }
      }
    });

    return NextResponse.json({ success: true, allAgendaManaged, agendaId: targetAgendaId });
  } catch (error: any) {
    console.error("POST appointment action error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
