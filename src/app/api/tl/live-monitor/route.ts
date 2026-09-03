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

    const operators = await prisma.user.findMany({
      where: { role: "OPERATORE", isActive: true },
      select: {
        id: true,
        name: true,
        lastActivityAt: true,
        maxIdleTimeMins: true,
        maxSkip: true,
        maxSkipMins: true,
        assignedContacts: {
          where: { isKo: false },
          select: { id: true, name: true, cap: true, assignedToId: true }
        },
        callLogs: {
          where: { createdAt: { gte: todayStart } },
          select: { outcome: true, createdAt: true }
        },
        activityLogs: {
          where: { createdAt: { gte: todayStart } },
          orderBy: { createdAt: "desc" },
          select: { action: true, createdAt: true, details: true }
        }
      }
    });

    const now = new Date();
    const nowMs = now.getTime();
    
    // Calcoliamo i timestamp assoluti per i confini di turno di oggi
    const shift1End = new Date(); shift1End.setHours(13, 5, 0, 0);
    const shift2End = new Date(); shift2End.setHours(17, 5, 0, 0);

    const liveOperators = await Promise.all(operators.map(async op => {
      let idleMinutes = 0;
      let isIdle = false;
      let isDisconnected = false;
      
      let autoLogoutReason: string | null = null;
      let latestLogAction = op.activityLogs.length > 0 ? op.activityLogs[0].action : null;
      
      // Troviamo l'ultimo LOGIN di oggi
      const lastLoginLog = op.activityLogs.find(l => l.action === "LOGIN");
      const sessionStartMs = lastLoginLog ? new Date(lastLoginLog.createdAt).getTime() : todayStart.getTime();

      // Stato attuale disconnesso se l'ultima azione e' un logout
      if (latestLogAction && ["FORCE_LOGOUT", "AUTO_LOGOUT", "LOGOUT"].includes(latestLogAction)) {
          isDisconnected = true;
      } else if (!op.lastActivityAt || new Date(op.lastActivityAt).getTime() < todayStart.getTime()) {
          // Mai loggato oggi o loggato da ieri e nessuna attivita' odierna
          isDisconnected = true;
      }

      if (op.lastActivityAt && !isDisconnected) {
        const lastActivityMs = new Date(op.lastActivityAt).getTime();
        idleMinutes = Math.floor((nowMs - lastActivityMs) / 60000);
        
        if (idleMinutes >= op.maxIdleTimeMins) {
          isIdle = true;
        }

        // Valutazione Regole di AUTO_LOGOUT (solo se attualmente connesso)
        
                // Priorità 1: Fine Turno Mattina (13:05)
        if (nowMs >= shift1End.getTime() && sessionStartMs < shift1End.getTime()) {
           autoLogoutReason = "SHIFT_END";
        }
        // Priorità 2: Fine Turno Pomeriggio (17:05)
        else if (nowMs >= shift2End.getTime() && sessionStartMs < shift2End.getTime()) {
           autoLogoutReason = "SHIFT_END";
        }
        // Priorità 3: Inattivita' (30 minuti)
        else if (idleMinutes > 30) {
          autoLogoutReason = "INACTIVITY";
        }
      }

      // Esecuzione ATOMICA Idempotente AUTO_LOGOUT tramite transazione con lock
      if (autoLogoutReason && !isDisconnected) {
        try {
          await prisma.$transaction(async (tx) => {
            // Lock sulla riga dell'utente per serializzare richieste concorrenti
            await tx.$executeRaw`SELECT id FROM "User" WHERE id = ${op.id} FOR UPDATE`;
            
            // Ricontrollo atomico: qual e' l'ultimissimo log reale nel DB?
            const dbLatestLog = await tx.activityLog.findFirst({
              where: { userId: op.id, createdAt: { gte: new Date(sessionStartMs) } },
              orderBy: { createdAt: "desc" }
            });
            
            // Inserisco l'AUTO_LOGOUT solo se la sessione non e' gia' terminata
            if (!dbLatestLog || !["FORCE_LOGOUT", "AUTO_LOGOUT", "LOGOUT"].includes(dbLatestLog.action)) {
              await tx.activityLog.create({
                data: {
                  userId: op.id,
                  action: "AUTO_LOGOUT",
                  details: autoLogoutReason
                }
              });
            }
          });
          isDisconnected = true;
          isIdle = false;
          idleMinutes = 0;
        } catch (e) {
          console.error(`Errore transazione atomic AUTO_LOGOUT per operatore ${op.id}:`, e);
        }
      }

      if (isDisconnected) {
          isIdle = false;
          idleMinutes = 0;
      }

      // Calcolo Statistiche Frontend
      let skip = 0; let noAnswer = 0; let notAvailable = 0; let nonInteressato = 0;
      let noInfo = 0; let trashRequest = 0; let reviewRequest = 0; let negotiation = 0;
      let appt = 0; let enrichment = 0; let logins = 0; let minutesOn = 0; let gestioneSeparata = 0;

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
      });

      op.activityLogs.forEach(log => {
        if (log.action === "LOGIN") logins++;
        if (log.action === "CONTACT_ENRICHED" || log.action === "MODIFIED_EXISTING_DATA") enrichment++;
        if (log.action === "GESTIONE_SEPARATA_REQUESTED") gestioneSeparata++;
      });

      let firstLogMs: number | null = null;
      let timeAdjustment = 0;

      op.callLogs.forEach(log => {
        const t = new Date(log.createdAt).getTime();
        if (!firstLogMs || t < firstLogMs) firstLogMs = t;
      });
      op.activityLogs.forEach(log => {
        const t = new Date(log.createdAt).getTime();
        if (!firstLogMs || t < firstLogMs) firstLogMs = t;
        if (log.action === "TIME_ADJUSTMENT") {
          timeAdjustment += parseInt(log.details || "0") || 0;
        }
      });

      if (firstLogMs && op.lastActivityAt) {
        let lastMs = new Date(op.lastActivityAt).getTime();
        
        if (isDisconnected && op.activityLogs.length > 0) {
            const mostRecentLog = op.activityLogs[0];
            if (["FORCE_LOGOUT", "LOGOUT"].includes(mostRecentLog.action)) {
                lastMs = new Date(mostRecentLog.createdAt).getTime();
            }
        }
        
        minutesOn = Math.max(0, Math.floor((lastMs - firstLogMs) / 60000));
      }
      
      minutesOn = Math.max(0, minutesOn + timeAdjustment);

      const timeWindowStartSkip = new Date(nowMs - (op.maxSkipMins || 60) * 60 * 1000);
      let recentSkips = 0;
      for (const log of op.activityLogs) {
        if (log.action === "OUTCOME_SKIP" && new Date(log.createdAt).getTime() >= timeWindowStartSkip.getTime()) {
          recentSkips++;
        }
      }

      return {
        id: op.id,
        name: op.name,
        idleMinutes,
        maxIdleTimeMins: op.maxIdleTimeMins,
        isIdle,
        isDisconnected,
        recentSkips,
        maxSkip: op.maxSkip || 5,
        currentContact: op.assignedContacts.length > 0 ? op.assignedContacts[0] : null,
        stats: { skip, noAnswer, notAvailable, nonInteressato, noInfo, trashRequest, reviewRequest, negotiation, appt, enrichment, logins, minutesOn }
      };
    }));

    return NextResponse.json({ operators: liveOperators });
  } catch (error) {
    console.error("Live monitor API error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}

