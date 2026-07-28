import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { 
      maxNoAnswer, maxNoAnswerMins, noAnswerLockTime,
      maxSkip, maxSkipMins, skipLockTime,
      maxNotAvailable, maxNotAvailableMins, notAvailableLockTime,
      maxIdleTimeMins,
      maxDeroghe, maxDerogheHours,
      alertNoAnswerLock, alertNotAvailableLock, alertSkipLock, alertIdleLock, alertDeroghe, alertModLock,
      maxDailyModifications, modLockTimeMins
    } = body;

    if (
      typeof maxNoAnswer !== "number" || typeof maxNoAnswerMins !== "number" || typeof noAnswerLockTime !== "number" ||
      typeof maxSkip !== "number" || typeof maxSkipMins !== "number" || typeof skipLockTime !== "number" ||
      typeof maxNotAvailable !== "number" || typeof maxNotAvailableMins !== "number" || typeof notAvailableLockTime !== "number" ||
      typeof maxIdleTimeMins !== "number" ||
      typeof maxDeroghe !== "number" || typeof maxDerogheHours !== "number" ||
      (maxDailyModifications !== undefined && typeof maxDailyModifications !== "number") ||
      (modLockTimeMins !== undefined && typeof modLockTimeMins !== "number")
    ) {
      return NextResponse.json({ error: "Invalid data types" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: id },
      data: {
        maxNoAnswer,
        maxNoAnswerMins,
        noAnswerLockTime,
        maxSkip,
        maxSkipMins,
        skipLockTime,
        maxNotAvailable,
        maxNotAvailableMins,
        notAvailableLockTime,
        maxIdleTimeMins,
        maxDeroghe,
        maxDerogheHours,
        maxDailyModifications: maxDailyModifications ?? 5,
        modLockTimeMins: modLockTimeMins ?? 10,
        alertNoAnswerLock: alertNoAnswerLock ?? true,
        alertNotAvailableLock: alertNotAvailableLock ?? true,
        alertSkipLock: alertSkipLock ?? true,
        alertIdleLock: alertIdleLock ?? true,
        alertDeroghe: alertDeroghe ?? true,
        alertModLock: alertModLock ?? true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST settings error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
