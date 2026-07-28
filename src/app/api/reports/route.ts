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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    if (!type || !startStr || !endStr) {
      return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
    }

    const gte = new Date(startStr);
    gte.setHours(0, 0, 0, 0);
    const lt = new Date(endStr);
    lt.setHours(23, 59, 59, 999);

    if (type === "operators") {
      const operators = await prisma.user.findMany({ where: { role: "OPERATORE" } });
      const report = [];

      // Fetch all aggregate stats in bulk
      const [activityStats, apptStats, skipStats, noAnswerStats] = await Promise.all([
        prisma.activityLog.groupBy({
          by: ['userId'],
          where: { createdAt: { gte, lt }, contactId: { not: null } },
          _count: { id: true }
        }),
        prisma.appointment.groupBy({
          by: ['operatorId'],
          where: { createdAt: { gte, lt } },
          _count: { id: true }
        }),
        prisma.callLog.groupBy({
          by: ['userId'],
          where: { createdAt: { gte, lt }, outcome: "SKIP" },
          _count: { id: true }
        }),
        prisma.callLog.groupBy({
          by: ['userId'],
          where: { createdAt: { gte, lt }, outcome: "NO_ANSWER" },
          _count: { id: true }
        })
      ]);

      const getActivityCount = (id: string) => activityStats.find(s => s.userId === id)?._count.id || 0;
      const getApptCount = (id: string) => apptStats.find(s => s.operatorId === id)?._count.id || 0;
      const getSkipCount = (id: string) => skipStats.find(s => s.userId === id)?._count.id || 0;
      const getNoAnswerCount = (id: string) => noAnswerStats.find(s => s.userId === id)?._count.id || 0;

      for (const op of operators) {
        const actionsCount = getActivityCount(op.id);
        const apptsCount = getApptCount(op.id);
        const skipCount = getSkipCount(op.id);
        const noAnswerCount = getNoAnswerCount(op.id);

        const conversion = actionsCount > 0 ? ((apptsCount / actionsCount) * 100).toFixed(2) + "%" : "0%";

        report.push({
          "Nome Operatore": op.name,
          "Contatti Gestiti": actionsCount,
          "Skip Effettuati": skipCount,
          "Non Risponde": noAnswerCount,
          "Appuntamenti Fissati": apptsCount,
          "Conversion Rate": conversion
        });
      }
      return NextResponse.json({ report });
    }

    if (type === "commercials") {
      const commercials = await prisma.user.findMany({ where: { role: "COMMERCIALE" } });
      const report = [];

      for (const comm of commercials) {
        const outcomes = await prisma.appointmentOutcome.findMany({
          where: {
            createdAt: { gte, lt },
            appointment: { commercialeId: comm.id }
          }
        });

        const total = outcomes.length;
        const ko = outcomes.filter(o => o.outcomeFinal === "KO" || o.koRequested).length;
        const positive = outcomes.filter(o => o.outcomeFinal === "VENDUTO").length;

        const koRate = total > 0 ? ((ko / total) * 100).toFixed(2) + "%" : "0%";
        const posRate = total > 0 ? ((positive / total) * 100).toFixed(2) + "%" : "0%";

        report.push({
          "Nome Commerciale": comm.name,
          "Appuntamenti Esitati": total,
          "Esiti Positivi": positive,
          "Esiti KO": ko,
          "% Positivi": posRate,
          "% KO": koRate
        });
      }
      return NextResponse.json({ report });
    }

    return NextResponse.json({ error: "Tipo report non valido" }, { status: 400 });

  } catch (error) {
    console.error("GET reports error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
