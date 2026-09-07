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

    const gestioneSeparataRequests = await prisma.gestioneSeparataRequest.findMany({
      where: { isResolved: false },
      include: {
        contact: { select: { name: true } },
      }
    });

    gestioneSeparataRequests.forEach(req => {
      activeAlerts.push({
        type: 'GESTIONE_SEPARATA_REQUEST',
        requestId: req.id,
        contactId: req.contactId,
        contactName: req.contact?.name || "Sconosciuto",
        operatorId: req.operatorId,
        reason: req.reason,
        requestedAt: req.createdAt
      });
    });

    const pendingDeroghe = await prisma.trattativaSheet.findMany({
      where: { derogaStatus: "PENDING" },
      include: {
        contact: { select: { name: true, address: true, cap: true } },
        events: { where: { eventType: "DEROGA_RICHIESTA" }, orderBy: { createdAt: "desc" }, take: 1 },
        currentOperator: { select: { name: true } }
      }
    });

    pendingDeroghe.forEach(d => {
      activeAlerts.push({
        type: 'DEROGA_APP_REQUEST',
        appId: d.id, // using trattativaId as appId identifier for the alert modal
        contactId: d.contactId,
        contactName: d.contact?.name || "Sconosciuto",
        operatorName: d.currentOperator?.name || "Operatore",
        date: d.nextActionDate || new Date(),
        address: d.contact?.address || "",
        cap: d.contact?.cap || "",
        referentName: d.referentName || "",
        clientNeeds: d.events[0]?.metadata?.notes || ""
      });
    });

    const hiddenContacts = await prisma.contact.findMany({
      where: { assignedToId: null, hiddenUntil: { gt: now } },
      include: {
        activityLogs: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });

    hiddenContacts.forEach(c => {
      if (c.activityLogs.length > 0 && c.activityLogs[0].action === "CONTACT_REVIEW_REQUESTED") {
        const isTrash = c.activityLogs[0].details?.toLowerCase().includes("eliminazione");
        activeAlerts.push({
          type: 'REVIEW_REQUEST',
          contactId: c.id,
          contactName: c.name,
          lockType: isTrash ? "TRASH_REQUEST" : "REVIEW",
          reviewNote: c.activityLogs[0].details,
          reviewRequestedAt: c.activityLogs[0].createdAt
        });
      }
    });

    return NextResponse.json({ alerts: activeAlerts });
  } catch (error) {
    console.error("GET alerts error:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}