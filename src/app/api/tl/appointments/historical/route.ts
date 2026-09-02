import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { ApptStatus, CommercialStatus, OutcomeFinal } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const tlId = (session.user as any).id;
    const body = await req.json();
    const { contactId, date, outcomeFinal, notes, commercialeId } = body;

    if (!contactId || !date || !outcomeFinal || !commercialeId) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    // CONTROLLO IDEMPOTENZA
    // Verifica se esiste gi un appuntamento storico "DONE" per questo contatto nella stessa data
    const apptDate = new Date(date);
    apptDate.setHours(12, 0, 0, 0); // Fissiamo l'ora alle 12:00
    
    const dayStart = new Date(apptDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(apptDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.appointment.findFirst({
      where: {
        contactId,
        date: { gte: dayStart, lte: dayEnd },
        status: "DONE"
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Esiste gi un appuntamento storico per questo contatto in questa data!" }, { status: 409 });
    }

    // Map outcomeFinal to commercialStatus
    let commercialStatus: CommercialStatus = "VISITATO";
    if (outcomeFinal === "KO") commercialStatus = "KO";
    else if (outcomeFinal === "VENDUTO") commercialStatus = "VENDUTO";
    else if (outcomeFinal === "FOLLOWUP") commercialStatus = "FOLLOW_UP";

    await prisma.$transaction(async (tx) => {
      // 1. Crea l'appuntamento storico
      const appt = await tx.appointment.create({
        data: {
          contactId,
          operatorId: tlId, // TL figura come operatore per questo record
          commercialeId,
          date: apptDate,
          status: "DONE",
          commercialStatus,
          
          tlNotes: "Inserito da TL come Storico",
          referentName: "Sconosciuto",
          referentRole: "",
          phone: "Sconosciuto",
          clientNeeds: "Storico"
        }
      });

      // 2. Crea l'esito dell'appuntamento
      await tx.appointmentOutcome.create({
        data: {
          appointmentId: appt.id,
          outcomeFinal: outcomeFinal as OutcomeFinal,
          notes: notes || "Esito storico registrato da TL"
        }
      });

      // 3. Nascondi il contatto per sempre (10 anni) e resetta eventuali revisioni
      await tx.contact.update({
        where: { id: contactId },
        data: {
          hiddenUntil: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000), // 10 anni
          assignedToId: null,
          reviewRequestedAt: null,
          reviewNote: null,
          isKo: outcomeFinal === "KO" ? true : false
        }
      });

      // 4. Log
      await tx.activityLog.create({
        data: {
          userId: tlId,
          contactId,
          action: "TL_HISTORICAL_APPOINTMENT",
          details: `Inserito app. storico con esito ${outcomeFinal}`
        }
      });
      
      // Se c'erano trattative aperte, chiudile
      await tx.negotiation.updateMany({
        where: { contactId, isAbandoned: false },
        data: { isAbandoned: true }
      });
      
      // Chiudi richieste eliminazione aperte
      await tx.deletionRequest.updateMany({
        where: { contactId, isResolved: false },
        data: { isResolved: true, isApproved: false, resolvedAt: new Date() }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST historical appointment error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
