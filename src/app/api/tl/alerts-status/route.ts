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

    // Fetch review requests (Strict Lock notes)
    const reviewContacts = await prisma.contact.findMany({
      where: { reviewRequestedAt: { not: null } },
      include: {
        assignedTo: { select: { id: true, name: true } },
        appointments: { where: { status: { in: ["PENDING", "CONFIRMED"] } }, select: { id: true, date: true, operatorId: true, operator: { select: { name: true } } } },
        negotiations: { where: { isAbandoned: false }, select: { id: true, operatorId: true, operator: { select: { name: true } } } },
        activityLogs: {
          where: { action: "CONTACT_REVIEW_REQUESTED" },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { user: { select: { id: true, name: true } } }
        }
      }
    });

    reviewContacts.forEach(c => {
      const requester = c.activityLogs[0]?.user;
      
      let lockContext = "Nessun blocco specifico trovato";
      let lockType = "NONE";
      if (c.appointments.length > 0) {
        lockType = "APPOINTMENT";
        lockContext = `Appuntamento fissato da ${c.appointments[0].operator?.name} il ${c.appointments[0].date.toLocaleString('it-IT')}`;
      } else if (c.negotiations.length > 0) {
        lockType = "NEGOTIATION";
        lockContext = `In Trattativa con ${c.negotiations[0].operator?.name}`;
      }

      activeAlerts.push({
        type: 'REVIEW_REQUEST',
        contactId: c.id,
        contactName: c.name,
        requesterName: requester?.name || "Sconosciuto",
        requesterId: requester?.id || "",
        reviewNote: c.reviewNote,
        reviewRequestedAt: c.reviewRequestedAt,
        lockContext,
        lockType
      });
    });

    return NextResponse.json({ alerts: activeAlerts });

  } catch (error) {
    console.error("GET alerts error:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
