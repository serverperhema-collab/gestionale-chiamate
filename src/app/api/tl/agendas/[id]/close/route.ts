import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const tlId = (session.user as any).id;
    const body = await req.json();
    const { action, commercialeId, notes } = body; 
    // action: "CLOSE_ASSIGN", "CLOSE_ONLY", "REOPEN", "UPDATE_NOTES"

    const agenda = await prisma.zoneAgenda.findUnique({ where: { id } });
    if (!agenda) {
      return NextResponse.json({ error: "Agenda non trovata" }, { status: 404 });
    }

    // Controllo regole: non si può riaprire se il giorno è già passato (o oggi è oltre mezzanotte?)
    // "la tl puo sbloccare un agenda se il giorno dell'agenda non e ancora passato. la tl non puo piu sbloccare l'agenda dopo che e passato il giorno del agenda"
    // Consideriamo il giorno passato se la data dell'agenda è precedente a oggi (senza ore).
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const agendaDate = new Date(agenda.date);
    const agendaDay = new Date(agendaDate.getFullYear(), agendaDate.getMonth(), agendaDate.getDate());

    const isPast = agendaDay < today;

    if (action === "REOPEN" && isPast) {
      return NextResponse.json({ error: "Non puoi sbloccare un'agenda di un giorno passato" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      let dataToUpdate: any = {};

      if (action === "UPDATE_NOTES") {
        dataToUpdate.tlNotes = notes;
      } 
      else if (action === "CLOSE_ONLY") {
        dataToUpdate.isClosed = true;
      } 
      else if (action === "CLOSE_ASSIGN") {
        dataToUpdate.isClosed = true;
        dataToUpdate.commercialeId = commercialeId;
        
        // Assegna il commerciale a tutti gli appuntamenti (confermati) di quell'agenda
        await tx.appointment.updateMany({
          where: { zoneAgendaId: id, status: "CONFIRMED" },
          data: { commercialeId }
        });
      }
      else if (action === "REOPEN") {
        dataToUpdate.isClosed = false;
      }

      await tx.zoneAgenda.update({
        where: { id },
        data: dataToUpdate
      });

      // Log dell'attività
      await tx.activityLog.create({
        data: {
          userId: tlId,
          action: "TL_AGENDA_ACTION",
          details: `Azione ${action} eseguita sull'agenda ${id}${notes ? " (con note)" : ""}`
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH agenda action error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
