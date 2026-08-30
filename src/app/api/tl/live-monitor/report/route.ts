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
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const operatorsParam = searchParams.get("operators"); // comma separated IDs or "ALL"

    if (!startParam || !endParam) {
      return NextResponse.json({ error: "Parametri date mancanti" }, { status: 400 });
    }

    const startDate = new Date(startParam);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(endParam);
    endDate.setHours(23, 59, 59, 999);

    let opFilter: any = { role: "OPERATORE" };
    if (operatorsParam && operatorsParam !== "ALL") {
      const ids = operatorsParam.split(",");
      opFilter = { ...opFilter, id: { in: ids } };
    }

    // Fetch operators with logs in the period
    const operators = await prisma.user.findMany({
      where: opFilter,
      select: {
        id: true,
        name: true,
        callLogs: {
          where: { createdAt: { gte: startDate, lte: endDate } },
          select: { outcome: true, createdAt: true }
        },
        activityLogs: {
          where: { createdAt: { gte: startDate, lte: endDate } },
          select: { action: true, createdAt: true, details: true }
        }
      }
    });

    const reportData = operators.map(op => {
      let skip = 0;
      let noAnswer = 0;
      let notAvailable = 0;
      let nonInteressato = 0;
      let noInfo = 0;
      let trashRequest = 0;
      let reviewRequest = 0;
      let negotiation = 0;
      let appt = 0;
      let enrichment = 0;
      let logins = 0;

      // Group logs by day to calculate accurate daily "Minutes On"
      const dailyLogs: Record<string, number[]> = {};
      const dailyAdjustments: Record<string, number> = {};

      op.callLogs.forEach(log => {
        if (log.outcome === "SKIP") skip++;
        if (log.outcome === "NO_ANSWER") noAnswer++;
        if (log.outcome === "NOT_AVAILABLE") notAvailable++;
        if (log.outcome === "NON_INTERESSATO") nonInteressato++;
        if (log.outcome === "NO_INFO") noInfo++;
        if (log.outcome === "TRASH_REQUEST") trashRequest++;
        if (log.outcome === ("REVIEW_REQUEST" as any)) reviewRequest++;
        if (log.outcome === "NEGOTIATION") negotiation++;
        if (log.outcome === "APPOINTMENT") appt++;

        const dateStr = new Date(log.createdAt).toISOString().split('T')[0];
        if (!dailyLogs[dateStr]) dailyLogs[dateStr] = [];
        dailyLogs[dateStr].push(new Date(log.createdAt).getTime());
      });

      op.activityLogs.forEach(log => {
        if (log.action === "LOGIN") logins++;
        if (log.action === "CONTACT_ENRICHED" || log.action === "MODIFIED_EXISTING_DATA") enrichment++;

        const dateStr = new Date(log.createdAt).toISOString().split('T')[0];
        if (!dailyLogs[dateStr]) dailyLogs[dateStr] = [];
        dailyLogs[dateStr].push(new Date(log.createdAt).getTime());

        if (log.action === "TIME_ADJUSTMENT") {
          if (!dailyAdjustments[dateStr]) dailyAdjustments[dateStr] = 0;
          dailyAdjustments[dateStr] += parseInt(log.details || "0") || 0;
        }
      });

      let totalMinutesOn = 0;
      let daysWorked = 0;

      for (const date in dailyLogs) {
        const times = dailyLogs[date];
        if (times.length > 0) {
          daysWorked++;
          const minTime = Math.min(...times);
          const maxTime = Math.max(...times);
          let minutesForDay = Math.floor((maxTime - minTime) / 60000);
          
          if (dailyAdjustments[date]) {
            minutesForDay += dailyAdjustments[date];
          }
          
          totalMinutesOn += Math.max(0, minutesForDay);
        }
      }

      return {
        id: op.id,
        name: op.name,
        stats: {
          skip,
          noAnswer,
          notAvailable,
          nonInteressato,
          noInfo,
          trashRequest,
          reviewRequest,
          negotiation,
          appt,
          enrichment,
          logins,
          minutesOn: totalMinutesOn,
          daysWorked
        }
      };
    });

    // Remove operators who have 0 days worked if filtering by ALL, maybe? 
    // Usually it's better to show them as 0 to see they did nothing.
    
    return NextResponse.json({ report: reportData });

  } catch (error) {
    console.error("Live monitor report API error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}



