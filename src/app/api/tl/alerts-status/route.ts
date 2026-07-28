import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();
    
    // Fetch all operators who are currently locked for any reason
    const lockedUsers = await prisma.user.findMany({
      where: {
        role: "OPERATORE",
        OR: [
          { skipLockedUntil: { gt: now } },
          { noAnswerLockedUntil: { gt: now } },
          { notAvailableLockedUntil: { gt: now } },
          { modLockedUntil: { gt: now } }
        ]
      },
      select: {
        id: true,
        name: true,
        skipLockedUntil: true,
        noAnswerLockedUntil: true,
        notAvailableLockedUntil: true,
        modLockedUntil: true,
        alertSkipLock: true,
        alertNoAnswerLock: true,
        alertNotAvailableLock: true,
        alertModLock: true,
      }
    });

    const activeAlerts: any[] = [];

    lockedUsers.forEach(u => {
      if (u.skipLockedUntil && u.skipLockedUntil > now && u.alertSkipLock) {
        activeAlerts.push({ userId: u.id, userName: u.name, type: 'SKIP', lockedUntil: u.skipLockedUntil });
      }
      if (u.noAnswerLockedUntil && u.noAnswerLockedUntil > now && u.alertNoAnswerLock) {
        activeAlerts.push({ userId: u.id, userName: u.name, type: 'NO_ANSWER', lockedUntil: u.noAnswerLockedUntil });
      }
      if (u.notAvailableLockedUntil && u.notAvailableLockedUntil > now && u.alertNotAvailableLock) {
        activeAlerts.push({ userId: u.id, userName: u.name, type: 'NOT_AVAILABLE', lockedUntil: u.notAvailableLockedUntil });
      }
      if (u.modLockedUntil && u.modLockedUntil > now && u.alertModLock) {
        activeAlerts.push({ userId: u.id, userName: u.name, type: 'MOD_LOCK', lockedUntil: u.modLockedUntil });
      }
    });

    return NextResponse.json({ alerts: activeAlerts });

  } catch (error) {
    console.error("GET alerts error:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
