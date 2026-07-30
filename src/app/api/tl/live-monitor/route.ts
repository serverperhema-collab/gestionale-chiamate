import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Fetch all active operators with their assigned contacts and today's logs
    const operators = await prisma.user.findMany({
      where: { role: "OPERATORE", isActive: true },
      select: {
        id: true,
        name: true,
        lastActivityAt: true,
        maxIdleTimeMins: true,
        skipCount: true,
        assignedContacts: {
          where: { isKo: false },
          select: {
            id: true,
            name: true,
            cap: true,
            assignedToId: true
          }
        },
        callLogs: {
          where: { createdAt: { gte: todayStart } },
          select: { outcome: true, createdAt: true }
        },
        activityLogs: {
          where: { createdAt: { gte: todayStart } },
          select: { action: true, createdAt: true }
        }
      }
    });

    const now = new Date().getTime();

    // Calculate idle status and stats
    const liveOperators = operators.map(op => {
      let idleMinutes = 0;
      let isIdle = false;
      
      if (op.lastActivityAt) {
        const lastActivityMs = new Date(op.lastActivityAt).getTime();
        idleMinutes = Math.floor((now - lastActivityMs) / 60000);
        if (idleMinutes >= op.maxIdleTimeMins) {
          isIdle = true;
        }
      }

      // Calculate Stats
      let skip = 0;
      let noAnswer = 0;
      let negotiation = 0;
      let appt = 0;
      let enrichment = 0;
      let logins = 0;
      let minutesOn = 0;

      op.callLogs.forEach(log => {
        if (log.outcome === "SKIP") skip++;
        if (log.outcome === "NO_ANSWER" || log.outcome === "NOT_AVAILABLE") noAnswer++;
        if (log.outcome === "NEGOTIATION") negotiation++;
        if (log.outcome === "APPOINTMENT") appt++;
      });

      op.activityLogs.forEach(log => {
        if (log.action === "LOGIN") logins++;
        if (log.action === "CONTACT_ENRICHED" || log.action === "MODIFIED_EXISTING_DATA") enrichment++;
      });

      // Calculate minutesOn: from first action today to lastActivityAt
      // Find the earliest log time
      let firstLogMs: number | null = null;
      op.callLogs.forEach(log => {
        const t = new Date(log.createdAt).getTime();
        if (!firstLogMs || t < firstLogMs) firstLogMs = t;
      });
      op.activityLogs.forEach(log => {
        const t = new Date(log.createdAt).getTime();
        if (!firstLogMs || t < firstLogMs) firstLogMs = t;
      });

      if (firstLogMs && op.lastActivityAt) {
        const lastMs = new Date(op.lastActivityAt).getTime();
        // Se lastMs è più piccolo (non dovrebbe), min 0
        minutesOn = Math.max(0, Math.floor((lastMs - firstLogMs) / 60000));
      }

      return {
        id: op.id,
        name: op.name,
        idleMinutes,
        maxIdleTimeMins: op.maxIdleTimeMins,
        isIdle,
        skipCount: op.skipCount,
        currentContact: op.assignedContacts.length > 0 ? op.assignedContacts[0] : null,
        stats: { skip, noAnswer, negotiation, appt, enrichment, logins, minutesOn }
      };
    });

    // We no longer filter out only the idle ones. We return ALL active operators for the leaderboard.
    return NextResponse.json({ operators: liveOperators });
  } catch (error) {
    console.error("Live monitor API error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
