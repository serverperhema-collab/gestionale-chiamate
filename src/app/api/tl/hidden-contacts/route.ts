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
        ],
        reviewRequestedAt: null // Escludi i contatti in revisione (es. Richieste Eliminazione), che stanno in 'Contatti Fasulli'
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
        },
        negotiations: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            recallDate: true,
            operator: { select: { name: true } }
          }
        },
        appointments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            date: true,
            status: true,
            operator: { select: { name: true } }
          }
        }
      },
      orderBy: {
        hiddenUntil: "asc"
      }
    });

    // Mappiamo per dedurre la motivazione
    const contactsWithReason = hiddenContacts.map(c => {
      let reason = "Motivo Sconosciuto";
      let blockedBy = c.assignedTo?.name || "Sistema";

      // 1. Controlliamo se c'è un appuntamento pendente/fissato
      if (c.appointments.length > 0 && ["PENDING", "CONFIRMED"].includes(c.appointments[0].status)) {
        const st = c.appointments[0].status;
        if (st === "PENDING") reason = "Appuntamento Fissato (Da Confermare)";
        else if (st === "CONFIRMED") reason = "Appuntamento Confermato";
        else reason = "Appuntamento Fissato";
        
        blockedBy = c.appointments[0].operator?.name || "Operatore Sconosciuto";
      } 
      // 2. Controlliamo se è una Trattativa
      else if (c.callLogs.length > 0 && c.callLogs[0].outcome === "NEGOTIATION") {
        reason = "Richiami operatore in corso";
        blockedBy = c.callLogs[0].user.name;
      }
      // 3. Controlliamo gli altri Call Logs
      else if (c.callLogs.length > 0) {
        const lastCall = c.callLogs[0];
        if (lastCall.outcome === "NO_ANSWER") {
          reason = `Non Risponde (${c.noAnswerCount} tentativi)`;
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
      
      // Override in base all'Activity Log se più recente, MA SOLO SE non è già un appuntamento
      if (!reason.startsWith("Appuntamento") && reason !== "Richiami operatore in corso" && c.activityLogs.length > 0) {
        const lastActivity = c.activityLogs[0];
        const lastCallDate = c.callLogs.length > 0 ? c.callLogs[0].createdAt : new Date(0);
        if (lastActivity.createdAt > lastCallDate && lastActivity.action.includes("TL_")) {
          // Rendiamo la scritta più umana
          if (lastActivity.action === "TL_UNBLOCK") {
             reason = "Sbloccato manualmente dalla TL";
          } else if (lastActivity.action === "TL_APPOINTMENT_ACTION") {
             reason = "Azione TL sull'appuntamento";
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
