import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const lost = await prisma.appointmentOutcome.findMany({
      where: {
        nextActionType: "RICHIAMO",
        nextActionTarget: "COMMERCIALE"
      },
      include: {
        appointment: true
      }
    });
    
    let restored = 0;
    for (const l of lost) {
      const existing = await prisma.appointment.findFirst({
        where: {
          contactId: l.appointment.contactId,
          status: "DA_GESTIRE_COMMERCIALE"
        }
      });

      if (!existing) {
        await prisma.appointment.create({
          data: {
            contactId: l.appointment.contactId,
            operatorId: l.appointment.operatorId,
            commercialeId: l.appointment.commercialeId,
            date: l.nextActionDate || new Date(),
            status: "DA_GESTIRE_COMMERCIALE",
            commercialStatus: "ASSEGNATO",
            tlNotes: "Richiamo Personale generato (Recuperato).",
            referentName: l.appointment.referentName || "Sconosciuto",
            referentRole: l.appointment.referentRole || "",
            phone: l.appointment.phone || "",
            clientNeeds: l.appointment.clientNeeds || "Richiamo"
          }
        });
        restored++;
      }
    }

    return NextResponse.json({ success: true, totalFound: lost.length, restored });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
