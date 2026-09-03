import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { CallOutcome } from "@prisma/client";
import { eventEmitter } from "@/lib/eventEmitter";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const userId = (session.user as any).id;
    const userName = (session.user as any).name;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    
    const body = await req.json();
    
    let existingNegotiation = null;
    if (body.outcome && body.outcome !== "SKIP") {
      existingNegotiation = await prisma.negotiation.findFirst({
        where: { contactId: id, operatorId: userId, isAbandoned: false }
      });
    }
    const { outcome, notes, recallDate, delayHours, targetCompany } = body;
    // Check note obbligatorie
    if (["NOT_AVAILABLE", "NEGOTIATION", "NON_INTERESSATO"].includes(outcome)) {
      if (!notes || notes.trim() === "") {
        return NextResponse.json({ error: "Le note sono obbligatorie per questo esito." }, { status: 400 });
      }
    }
    if (outcome === "NEGOTIATION" && !recallDate) {
      return NextResponse.json({ error: "Data di ricontatto obbligatoria per le trattative." }, { status: 400 });
    }

    // Check if operator is skip-locked (if they are trying to skip again)
    if (outcome === "SKIP" && user.role === "OPERATORE" && user.skipLockedUntil && user.skipLockedUntil > new Date()) {
      return NextResponse.json({ 
        error: "Sei bloccato per troppi Skip. Non puoi saltare contatti finché la TL non ti sblocca." 
      }, { status: 403 });
    }
    
    // Check if operator is noAnswer-locked
    if (user.role === "OPERATORE" && user.noAnswerLockedUntil && user.noAnswerLockedUntil > new Date()) {
      return NextResponse.json({
        error: "Sei temporaneamente bloccato a causa di troppi 'Non Risponde' ravvicinati. Attendi lo scadere del tempo."
      }, { status: 403 });
    }

    // Check if operator is notAvailable-locked
    if (user.role === "OPERATORE" && user.notAvailableLockedUntil && user.notAvailableLockedUntil > new Date()) {
      return NextResponse.json({
        error: "Sei temporaneamente bloccato a causa di troppi 'Non Reperibile' ravvicinati. Attendi lo scadere del tempo."
      }, { status: 403 });
    }

    const contact = await prisma.contact.findUnique({ where: { id: id }, include: { assignedTo: true } });
    if (!contact) return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });

    const transaction = [];
    const role = (session.user as any).role;

    if (contact.assignedTo?.role === "COMMERCIALE" && role === "OPERATORE") {
      transaction.push(prisma.notification.create({
        data: {
          userId: contact.assignedToId!,
          title: "Richiamo Lavorato (Esito)",
          message: `L'operatore ${userName} ha lavorato il tuo richiamo "${contact.name}". Nuovo esito: ${outcome}.`,
          contactId: contact.id
        }
      }));
    }
    let willLock = false;
    let willLockNoAnswer = false;

    if (outcome === "SKIP") {
      // 1. Aggiungi il log per lo SKIP
      transaction.push(prisma.activityLog.create({
        data: {
          userId,
          contactId: id,
          action: "CONTACT_SKIPPED",
          details: notes || "Nessuna nota fornita"
        }
      }));

      // 2. Togli l'assegnazione
      transaction.push(prisma.contact.update({
        where: { id: id },
        data: { assignedToId: null }
      }));

      // 3. Gestisci lo skipCount e il blocco a tempo
      const newSkipCount = user.skipCount + 1;
      
      const timeWindowStartSkip = new Date(Date.now() - user.maxSkipMins * 60 * 1000);
      const recentSkips = await prisma.activityLog.count({
        where: {
          userId: userId,
          action: "CONTACT_SKIPPED",
          createdAt: { gte: timeWindowStartSkip }
        }
      });

      if (recentSkips + 1 >= user.maxSkip && user.role === "OPERATORE") {
        willLock = true;
        eventEmitter.emit("tl-alert", { 
          type: "LOCK", 
          operatorName: userName, 
          reason: `Bloccato automaticamente per eccesso di Skip ravvicinati.` 
        });
      }

      transaction.push(prisma.user.update({
        where: { id: userId },
        data: {
          skipCount: newSkipCount,
          skipLockedUntil: willLock ? new Date(Date.now() + user.skipLockTime * 60 * 1000) : null
        }
      }));

    } else {
      // Esito standard (Non risponde, KO, ecc.)
      
      // 1. Crea il CallLog
      transaction.push(prisma.callLog.create({
        data: {
          userId,
          contactId: id,
          outcome: outcome as CallOutcome,
          notes: notes || null
        }
      }));

      // 1.b Crea l'ActivityLog per farlo apparire nella vista Globale del TL
      // (Escludiamo TRASH_REQUEST perche' lo crea gia' sotto come CONTACT_REVIEW_REQUESTED)
      if (outcome !== "TRASH_REQUEST") {
        transaction.push(prisma.activityLog.create({
          data: {
            userId,
            contactId: id,
            action: "OUTCOME_" + outcome,
            details: notes || "Nessuna nota"
          }
        }));
      }

      // 2. Aggiorna lo stato del contatto in base all'esito
      // Rimuove automaticamente dalla coda TL se era in revisione (deroga lavorata)
      const contactUpdateData: any = { assignedToId: null, reviewRequestedAt: null, reviewNote: null };

      if (outcome === "NO_ANSWER") {
        contactUpdateData.noAnswerCount = { increment: 1 };
        if (contact.noAnswerCount === 0) {
          contactUpdateData.hiddenUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        } else {
          contactUpdateData.hiddenUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 ora
        }
        
        // Anti-Frode Frequency Check
        const timeWindowStart = new Date(Date.now() - user.maxNoAnswerMins * 60 * 1000);
        const recentNoAnswers = await prisma.callLog.count({
          where: {
            userId: userId,
            outcome: "NO_ANSWER",
            createdAt: { gte: timeWindowStart }
          }
        });
        
        // Se aggiungendo questo superiamo il limite
        if (recentNoAnswers + 1 >= user.maxNoAnswer && user.role === "OPERATORE") {
          willLockNoAnswer = true;
          eventEmitter.emit("tl-alert", { 
            type: "LOCK", 
            operatorName: userName, 
            reason: `Bloccato automaticamente per eccesso di "Non Risponde" ravvicinati.` 
          });
          transaction.push(prisma.user.update({
            where: { id: userId },
            data: { noAnswerLockedUntil: new Date(Date.now() + user.noAnswerLockTime * 60 * 1000) }
          }));
        }

      } else if (outcome === "NOT_AVAILABLE") {
        // Nascondi per X ore (default 2 ore se non specificato)
        const oreRitardo = delayHours ? parseFloat(delayHours) : 2;
        contactUpdateData.hiddenUntil = new Date(Date.now() + oreRitardo * 60 * 60 * 1000);

        // Anti-Frode Frequency Check per Non Reperibile
        const timeWindowStartNA = new Date(Date.now() - user.maxNotAvailableMins * 60 * 1000);
        const recentNAs = await prisma.callLog.count({
          where: {
            userId: userId,
            outcome: "NOT_AVAILABLE",
            createdAt: { gte: timeWindowStartNA }
          }
        });
        
        // Se aggiungendo questo superiamo il limite
        if (recentNAs + 1 >= user.maxNotAvailable && user.role === "OPERATORE") {
          willLockNoAnswer = true; // Riusiamo la stessa variabile per ritornare il flag di blocco
          eventEmitter.emit("tl-alert", { 
            type: "LOCK", 
            operatorName: userName, 
            reason: `Bloccato automaticamente per eccesso di "Non Reperibile" ravvicinati.` 
          });
          transaction.push(prisma.user.update({
            where: { id: userId },
            data: { notAvailableLockedUntil: new Date(Date.now() + user.notAvailableLockTime * 60 * 1000) }
          }));
        }
      } else if (outcome === "NON_INTERESSATO") {
        // Nascondi per 90 giorni (3 mesi)
        contactUpdateData.hiddenUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        contactUpdateData.lastOutcome = "NON_INTERESSATO";
      } else if (outcome === "NO_INFO") {
        // "butta in un angolo per 24 ore"
        contactUpdateData.hiddenUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      } else if (outcome === "NEGOTIATION") {
        contactUpdateData.hiddenUntil = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000); // 10 anni (Invisibile al calderone)
        
        if (existingNegotiation) {
          transaction.push(prisma.negotiation.update({
            where: { id: existingNegotiation.id },
            data: {
              recallDate: new Date(recallDate),
              reason: existingNegotiation.reason + "\n---\nAggiornamento (" + new Date().toLocaleString("it-IT") + "): " + notes
            }
          }));
        } else {
          transaction.push(prisma.negotiation.create({
            data: {
              contactId: id,
              operatorId: userId,
              reason: notes,
              recallDate: new Date(recallDate),
              isApproved: true // Auto-approved recall
            }
          }));
        }
      } else if (outcome === "APPOINTMENT") {
        // Nascondiamo il contatto dal calderone, è in lavorazione o fissato
        contactUpdateData.hiddenUntil = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000); // 10 anni (Invisibile al calderone)
      } else if (outcome === "TRASH_REQUEST") {
        contactUpdateData.hiddenUntil = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000); // 10 anni (per sempre finché TL non sblocca)
        contactUpdateData.reviewRequestedAt = new Date();
        contactUpdateData.reviewNote = `RICHIESTA ELIMINAZIONE: ${notes || "Nessuna motivazione"}`;
        
        eventEmitter.emit("tl-alert", { 
          type: "REVIEW", 
          operatorName: userName, 
          reason: `Richiesta eliminazione contatto da valutare.` 
        });

        transaction.push(prisma.deletionRequest.create({
          data: {
            contactId: id,
            operatorId: userId,
            reason: notes || "Nessuna motivazione"
          }
        }));

        transaction.push(prisma.activityLog.create({
          data: {
            userId: userId,
            contactId: id,
            action: "CONTACT_REVIEW_REQUESTED",
            details: `RICHIESTA ELIMINAZIONE: ${notes || "Nessuna motivazione"}`
          }
        }));
      }

      // Se c'è una data di richiamo personalizzata (ma la negotiation la gestisce diversamente, l'ho messa 1 anno nascosta dal calderone)
      // Togliamo questo blocco che sovrascriverebbe hiddenUntil e la rimetterebbe in circolo!
      // In negotiation non deve tornare nel calderone globale, ci pensa la tab "Le mie Trattative"
      
      if (targetCompany) {
        contactUpdateData.targetCompany = targetCompany;
      }

      transaction.push(prisma.contact.update({
        where: { id: id },
        data: contactUpdateData
      }));

      // 3. Resetta lo skipCount dell'operatore perché ha fatto un'azione valida!
      if (user.skipCount > 0) {
        transaction.push(prisma.user.update({
          where: { id: userId },
          data: { skipCount: 0 }
        }));
      }
    }

    await prisma.$transaction(transaction);

    // Update last activity
    await prisma.user.update({
      where: { id: userId },
      data: { lastActivityAt: new Date() }
    });

    return NextResponse.json({ 
      success: true, 
      locked: willLock || willLockNoAnswer,
      reason: willLockNoAnswer ? "Troppi 'Non Risponde' ravvicinati." : (willLock ? "Troppi Skip consecutivi." : "")
    });

  } catch (error) {
    console.error("POST outcome error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
