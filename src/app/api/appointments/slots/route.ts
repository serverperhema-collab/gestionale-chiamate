import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const agendaId = searchParams.get("agendaId");

    if (!agendaId) {
      return NextResponse.json({ error: "Agenda ID richiesto" }, { status: 400 });
    }

    const agenda = await prisma.zoneAgenda.findUnique({
      where: { id: agendaId }
    });

    if (!agenda) {
      return NextResponse.json({ slots: [] }); // Nessuna agenda aperta
    }

    const targetDate = new Date(agenda.date);

    const startOfTargetDay = new Date(targetDate);
    startOfTargetDay.setHours(0, 0, 0, 0);
    
    const endOfTargetDay = new Date(targetDate);
    endOfTargetDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        zoneAgendaId: agendaId,
        status: { not: "CANCELLED" }
      }
    });

    const startWorkHour = 9; // 09:00
    const endWorkHour = 18; // 18:00
    const intervalMinutes = 15;
    const bufferMinutes = 45;

    let availableSlots: any[] = [];
    let currentSlot = new Date(targetDate);
    currentSlot.setHours(startWorkHour, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(endWorkHour, 0, 0, 0);

    // Generiamo gli slot ed escludiamo quelli che distano meno di 45 min da appuntamenti esistenti
    while (currentSlot <= endOfDay) {
      let isBlocked = false;

      for (const appt of existingAppointments) {
        const diffMinutes = Math.abs(currentSlot.getTime() - appt.date.getTime()) / (1000 * 60);
        if (diffMinutes < bufferMinutes) {
          isBlocked = true;
          break;
        }
      }

      if (!isBlocked) {
        availableSlots.push({
          time: currentSlot.toLocaleTimeString("it-IT", { hour: '2-digit', minute: '2-digit' }),
          date: currentSlot.toISOString(),
        });
      }
      
      currentSlot.setMinutes(currentSlot.getMinutes() + intervalMinutes);
    }

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error("GET slots error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
