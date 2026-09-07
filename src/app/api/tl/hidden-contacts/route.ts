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

    const now = new Date();

    const hiddenContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { hiddenUntil: { gt: now } },
          { isKo: true }
        ]
      },
      select: {
        id: true,
        name: true,
        cap: true,
        address: true,
        originalPhone: true,
        hiddenUntil: true,
        noAnswerCount: true,
        assignedTo: {
          select: { name: true }
        },
        trattativa: { select: { id: true, status: true } },
          callLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            outcome: true,
            createdAt: true,
            user: { select: { name: true } }
          }
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            action: true,
            details: true,
            createdAt: true,
            user: { select: { name: true } }
          }
        }
      },
      orderBy: {
        hiddenUntil: "asc"
      }
    });

    const contactsWithReason = hiddenContacts.map(c => {
      let reason = "Motivo Sconosciuto";
      let blockedBy = c.assignedTo?.name || "Sistema";

      if (c.callLogs.length > 0 && c.callLogs[0].outcome === "NEGOTIATION") {
        reason = "Richiami operatore in corso";
        blockedBy = c.callLogs[0].user.name;
      }
      else if (c.callLogs.length > 0) {
        const lastCall = c.callLogs[0];
        if (lastCall.outcome === "NO_ANSWER") {
            const timeStr = c.noAnswerCount === 1 ? "10 MIN" : (c.noAnswerCount === 2 ? "1 ORA" : "4 ORE");
            reason = `Non Risponde BLOCCATO PER ${timeStr}`;
            blockedBy = lastCall.user.name;
          } else if (lastCall.outcome === "NOT_AVAILABLE") {
          reason = "Non Reperibile Temporaneamente";
          blockedBy = lastCall.user.name;
        } else if (lastCall.outcome === "NO_INFO") {
          reason = "Non Reperibile Senza Info";
          blockedBy = lastCall.user.name;
        } else if (lastCall.outcome === "TRASH_REQUEST") {
          reason = "In attesa di approvazione scarto (Cancellazione)";
          blockedBy = lastCall.user.name;
        } else {
          reason = `Esito: ${lastCall.outcome}`;
          blockedBy = lastCall.user.name;
        }
      }
      
      if (reason !== "Richiami operatore in corso" && c.activityLogs.length > 0) {
        const lastActivity = c.activityLogs[0];
        const lastCallDate = c.callLogs.length > 0 ? c.callLogs[0].createdAt : new Date(0);
        if (lastActivity.createdAt > lastCallDate && lastActivity.action.includes("TL_")) {
          if (lastActivity.action === "TL_UNBLOCK") {
             reason = "Sbloccato manualmente dalla TL";
          } else {
             reason = `Azione TL: ${lastActivity.details}`;
          }
          blockedBy = lastActivity.user.name;
        }
      }

      return {
        id: c.id,
        name: c.name,
        cap: c.cap,
        address: c.address,
        phone: c.originalPhone,
        hiddenUntil: c.hiddenUntil,
        reason,
        blockedBy
      };
    });

    return NextResponse.json({ contacts: contactsWithReason });
  } catch (error) {
    console.error("GET hidden contacts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}