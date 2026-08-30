import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
// AttendanceStatus and AbsenceReason enums will be available after prisma generate

export const dynamic = "force-dynamic";

function computePlannedHours(morning: boolean, afternoon: boolean): number {
  if (morning && afternoon) return 7;
  if (morning) return 4;
  if (afternoon) return 3;
  return 0;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json({ error: "Parametri from e to obbligatori" }, { status: 400 });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    fromDate.setUTCHours(0, 0, 0, 0);
    toDate.setUTCHours(23, 59, 59, 999);

    const operators = await (prisma as any).user.findMany({
      where: { role: "OPERATORE", isActive: true },
      select: {
        id: true,
        name: true,
        attendances: {
          where: { date: { gte: fromDate, lte: toDate } },
          orderBy: { date: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const operatorsWithStats = operators.map((op: any) => {
      const records: any[] = op.attendances;
      const totalHours = records.reduce((sum: number, r: any) => sum + r.hoursWorked, 0);
      const presenti = records.filter((r: any) => r.status === "PRESENTE").length;
      const parziali = records.filter((r: any) => r.status === "PARZIALE").length;
      const totalAbsences =
        records.filter((r: any) => r.status === "ASSENTE").length +
        records.filter((r: any) => r.status === "PARZIALE" && r.reason !== null).length;
      const ferie = records.filter((r: any) => r.reason === "FERIE").length;
      const malattia = records.filter((r: any) => r.reason === "MALATTIA").length;
      const permessi = records.filter((r: any) => r.reason === "PERMESSO").length;
      const altro = records.filter((r: any) => r.reason === "ALTRO").length;

      return {
        id: op.id,
        name: op.name,
        attendances: records,
        stats: { totalHours, presenti, parziali, totalAbsences, ferie, malattia, permessi, altro },
      };
    });

    const globalStats = {
      totalHours: operatorsWithStats.reduce((s: number, o: any) => s + o.stats.totalHours, 0),
      presenti: operatorsWithStats.reduce((s: number, o: any) => s + o.stats.presenti, 0),
      totalAbsences: operatorsWithStats.reduce((s: number, o: any) => s + o.stats.totalAbsences, 0),
      ferie: operatorsWithStats.reduce((s: number, o: any) => s + o.stats.ferie, 0),
      malattia: operatorsWithStats.reduce((s: number, o: any) => s + o.stats.malattia, 0),
      permessi: operatorsWithStats.reduce((s: number, o: any) => s + o.stats.permessi, 0),
      altro: operatorsWithStats.reduce((s: number, o: any) => s + o.stats.altro, 0),
    };

    return NextResponse.json({ operators: operatorsWithStats, globalStats });
  } catch (error) {
    console.error("GET attendance error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const tlId = (session.user as any).id;

    const body = await req.json();
    const { userId, date, status, shiftMorning, shiftAfternoon, hoursWorked, reason, customReason } = body;

    if (!userId || !date || !status) {
      return NextResponse.json({ error: "userId, date e status sono obbligatori" }, { status: 400 });
    }

    // AUTORIZZAZIONE: solo operatori gestibili
    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!targetUser || targetUser.role !== "OPERATORE") {
      return NextResponse.json({ error: "Utente non trovato o non e un operatore" }, { status: 403 });
    }

    const morning = Boolean(shiftMorning);
    const afternoon = Boolean(shiftAfternoon);
    const planned = computePlannedHours(morning, afternoon);

    let finalHoursWorked: number;
    let finalReason: string | null = null;
    let finalCustomReason: string | null = null;
    let finalMorning = morning;
    let finalAfternoon = afternoon;

    if (status === "PRESENTE") {
      if (planned === 0) {
        return NextResponse.json({ error: "Per PRESENTE e necessario selezionare almeno un turno" }, { status: 400 });
      }
      finalHoursWorked = planned;

    } else if (status === "PARZIALE") {
      if (planned === 0) {
        return NextResponse.json({ error: "Per PARZIALE e necessario selezionare almeno un turno" }, { status: 400 });
      }
      const hw = parseFloat(hoursWorked);
      if (isNaN(hw) || hw <= 0 || hw >= planned) {
        return NextResponse.json(
          { error: `Per PARZIALE le ore effettive devono essere tra 0 e ${planned} (esclusi)` },
          { status: 400 }
        );
      }
      if (!reason) {
        return NextResponse.json({ error: "Per PARZIALE il motivo e obbligatorio" }, { status: 400 });
      }
      if (reason === "ALTRO" && !customReason?.trim()) {
        return NextResponse.json({ error: "Per motivo Altro la nota e obbligatoria" }, { status: 400 });
      }
      finalHoursWorked = hw;
      finalReason = reason;
      finalCustomReason = customReason?.trim() || null;

    } else if (status === "ASSENTE") {
      if (!reason) {
        return NextResponse.json({ error: "Per ASSENTE il motivo e obbligatorio" }, { status: 400 });
      }
      if (reason === "ALTRO" && !customReason?.trim()) {
        return NextResponse.json({ error: "Per motivo Altro la nota e obbligatoria" }, { status: 400 });
      }
      finalHoursWorked = 0;
      finalMorning = false;
      finalAfternoon = false;
      finalReason = reason;
      finalCustomReason = customReason?.trim() || null;

    } else {
      return NextResponse.json({ error: "Stato non valido" }, { status: 400 });
    }

    const recordDate = new Date(date);
    recordDate.setUTCHours(0, 0, 0, 0);

    const record = await (prisma as any).attendance.upsert({
      where: { userId_date: { userId, date: recordDate } },
      create: {
        userId,
        date: recordDate,
        status: status as any,
        shiftMorning: finalMorning,
        shiftAfternoon: finalAfternoon,
        plannedHours: status === "ASSENTE" ? 0 : planned,
        hoursWorked: finalHoursWorked,
        reason: finalReason as any,
        customReason: finalCustomReason,
        updatedById: tlId,
      },
      update: {
        status: status as any,
        shiftMorning: finalMorning,
        shiftAfternoon: finalAfternoon,
        plannedHours: status === "ASSENTE" ? 0 : planned,
        hoursWorked: finalHoursWorked,
        reason: finalReason as any,
        customReason: finalCustomReason,
        updatedById: tlId,
      },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error("POST attendance error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}


