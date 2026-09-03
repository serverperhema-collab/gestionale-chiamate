import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OPERATORE", "COMMERCIALE", "TEAM_LEADER"].includes((session.user as any).role)) {
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
      return NextResponse.json({ slots: [] });
    }

    // Estrarre l'anno, mese e giorno dell'agenda (formattati in Rome time)
    const formatter = new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Europe/Rome', 
      year: 'numeric', month: '2-digit', day: '2-digit' 
    });
    // Formatter restituisce YYYY-MM-DD
    const agendaDateStr = formatter.format(agenda.date);
    const [yearStr, monthStr, dayStr] = agendaDateStr.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const day = parseInt(dayStr);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        zoneAgendaId: agendaId,
        status: { not: "CANCELLED" }
      }
    });

    // Funzione helper per ottenere i minuti totali della giornata (0-1440) per un Date object in fuso orario di Roma
    const getRomeMinutes = (dateObj: Date) => {
      const timeFormatter = new Intl.DateTimeFormat('it-IT', { 
        timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' 
      });
      const [h, m] = timeFormatter.format(dateObj).split(':').map(Number);
      return h * 60 + m;
    };

    const existingApptsMinutes = existingAppointments.map(a => getRomeMinutes(a.date));

    const startWorkHour = 9; // 09:00
    const endWorkHour = 18; // 18:00
    const intervalMinutes = 15;
    const bufferMinutes = 45;

    let availableSlots: any[] = [];

    for (let h = startWorkHour; h <= endWorkHour; h++) {
        for (let m = 0; m < 60; m += intervalMinutes) {
            if (h === endWorkHour && m > 0) continue;

            const currentSlotMinutes = h * 60 + m;
            let isBlocked = false;

            for (const apptMins of existingApptsMinutes) {
                if (Math.abs(currentSlotMinutes - apptMins) < bufferMinutes) {
                    isBlocked = true;
                    break;
                }
            }

            if (!isBlocked) {
                const hh = h.toString().padStart(2, '0');
                const mm = m.toString().padStart(2, '0');
                availableSlots.push({
                    time: `${hh}:${mm}`,
                    year,
                    month,
                    day,
                    hour: h,
                    minute: m
                });
            }
        }
    }

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error("GET slots error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
