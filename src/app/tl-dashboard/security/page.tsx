import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SecurityClient from "./SecurityClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SecurityDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "TEAM_LEADER") {
    redirect("/unauthorized");
  }

  const now = new Date();
  const lockedUsers = await prisma.user.findMany({
    where: {
      role: "OPERATORE",
      OR: [
        { skipLockedUntil: { gt: now } },
        { modLockedUntil: { gt: now } },
        { noAnswerLockedUntil: { gt: now } },
        { notAvailableLockedUntil: { gt: now } },
        { isSuspended: true }
      ]
    },
    select: {
      id: true,
      name: true,
      skipLockedUntil: true,
      modLockedUntil: true,
      noAnswerLockedUntil: true,
      notAvailableLockedUntil: true,
      skipCount: true,
      dailyModifications: true,
      isSuspended: true
    }
  });

  const allOperators = await prisma.user.findMany({
    where: { role: "OPERATORE", isActive: true },
    select: { 
      id: true, name: true, 
      maxNoAnswer: true, maxNoAnswerMins: true, noAnswerLockTime: true,
      maxSkip: true, maxSkipMins: true, skipLockTime: true,
      maxNotAvailable: true, maxNotAvailableMins: true, notAvailableLockTime: true,
      maxIdleTimeMins: true,
      maxDeroghe: true, maxDerogheHours: true,
      maxDailyModifications: true, modLockTimeMins: true,
      alertNoAnswerLock: true, alertNotAvailableLock: true, alertSkipLock: true,
      alertIdleLock: true, alertDeroghe: true, alertModLock: true
    }
  });

  return (
    <div className="flex-1 p-8 bg-gray-900 min-h-screen text-gray-100">
      <div className="mb-6">
        <Link href="/tl-dashboard" className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition shadow-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Dashboard
        </Link>
      </div>
      <h2 className="text-2xl font-semibold text-white mb-6 tracking-tight">Centro di Sicurezza e Blocchi</h2>
      <p className="text-gray-400 mb-8">
        Monitora gli operatori bloccati dal sistema anti-frode e modifica i parametri di sicurezza.
      </p>

      <SecurityClient initialLockedUsers={lockedUsers} allOperators={allOperators} />
    </div>
  );
}
