import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tlId = (session.user as any).id;
    const tlRole = (session.user as any).role;
    
    const body = await req.json();
    const { 
      contactId, operatorId, commercialeId, 
      eventType, eventDate, eventTime, eventNotes, 
      preventivo, isPast, outcome, nextDate, nextTime, outcomeNotes 
    } = body;

    if (!contactId || !operatorId || !eventType || !eventDate || !eventTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // GAP 3 FIX: Commerciale Validation
    if (isPast && outcome === "RICHIAMO_COMMERCIALE" && !commercialeId) {
      return NextResponse.json({ error: "Seleziona un Commerciale dal menu a tendina per poter assegnare la trattativa." }, { status: 400 });
    }

    const eventDateTime = new Date(`${eventDate}T${eventTime}`);

    let trattativaStatus = "TRATTATIVA_IN_CORSO" as any;
    let computedNextActionType = "NONE";
    
    // GAP 2 FIX: Next Action Type Logic
    if (!isPast) {
      // Event in future
      if (eventType === "TELEFONO") {
        trattativaStatus = "RICHIAMO_PERSONALE";
        computedNextActionType = "RICHIAMO";
      }
      if (eventType === "APPUNTAMENTO") {
        trattativaStatus = "APPUNTAMENTO";
        computedNextActionType = "APPUNTAMENTO";
      }
    } else {
      // Event in past, rely on outcome
      if (outcome === "RICHIAMO_OPERATORE") {
        trattativaStatus = "RICHIAMO_PERSONALE";
        computedNextActionType = "RICHIAMO";
      }
      if (outcome === "RICHIAMO_COMMERCIALE") {
        trattativaStatus = "TRATTATIVA_IN_CORSO";
        computedNextActionType = "RICHIAMO";
      }
      if (outcome === "CONTRATTO_FIRMATO") {
        trattativaStatus = "CHIUSA_VINTA";
      }
      if (outcome === "KO_DEFINITIVO") {
        trattativaStatus = "CHIUSA_PERSA";
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const trattativa = await tx.trattativaSheet.create({
        data: {
          contactId,
          status: trattativaStatus,
          currentOperatorId: operatorId,
          createdByOperatorId: operatorId,
          currentCommercialeId: commercialeId || null,
          nextActionType: computedNextActionType as any,
          nextActionDate: isPast ? (nextDate && nextTime ? new Date(`${nextDate}T${nextTime}`) : null) : eventDateTime
        }
      });

      // GAP 1 FIX: Update Contact Model
      const contactUpdateData: any = {
          assignedToId: operatorId,
          hiddenUntil: null,
          blacklisted: false,
          isKo: false
      };
      if (trattativaStatus === "CHIUSA_PERSA") {
          contactUpdateData.isKo = true;
          contactUpdateData.assignedToId = null;
      }
      await tx.contact.update({
          where: { id: contactId },
          data: contactUpdateData
      });

      // GAP 4 FIX: More semantic Initial Event Type
      const tl = await tx.user.findUnique({ where: { id: tlId } });
      
      let initialDesc = "";
      let initialEventType = "NOTA_AGGIUNTA" as any;

      if (eventType === "TELEFONO") {
        initialDesc = `Il ${new Date(eventDate).toLocaleDateString('it-IT')} alle ore ${eventTime} è avvenuto un contatto telefonico.\nNote: ${eventNotes}`;
        initialEventType = isPast ? "ESITO_INSERITO" : "RICHIAMO_IMPOSTATO";
      } else {
        initialDesc = `Il ${new Date(eventDate).toLocaleDateString('it-IT')} alle ore ${eventTime} è stato fissato un appuntamento.\nNote: ${eventNotes}`;
        initialEventType = "APPUNTAMENTO_FISSATO";
      }
      
      await tx.trattativaEvent.create({
        data: {
          trattativaId: trattativa.id,
          eventType: initialEventType,
          description: `Trattativa generata da TL (${tl?.name}). ${initialDesc}`,
          userId: tlId,
          userRole: tlRole,
        }
      });

      if (preventivo) {
        await tx.trattativaEvent.create({
          data: {
            trattativaId: trattativa.id,
            eventType: "NOTA_AGGIUNTA", // Fallback valid enum for Preventivo Inviato
            description: `[PREVENTIVO] Il giorno ${new Date(preventivo.date).toLocaleDateString('it-IT')} da ${preventivo.by} è stato inviato un preventivo al cliente. Note: ${preventivo.notes || 'nessuna'}`,
            userId: tlId,
            userRole: tlRole,
          }
        });
      }

      // ENUM BUG FIXES: "CONTRATTO_FIRMATA" -> "CONTRATTO_FIRMATO", "KO_PERSO" -> "KO_DEFINITIVO"
      if (isPast && outcome) {
        if (outcome === "CONTRATTO_FIRMATO") {
          await tx.trattativaEvent.create({
            data: {
              trattativaId: trattativa.id,
              eventType: "CONTRATTO_FIRMATO",
              description: `Contratto Firmato. Note: ${outcomeNotes}`,
              userId: tlId,
              userRole: tlRole,
            }
          });
          await tx.trattativaSheet.update({
            where: { id: trattativa.id },
            data: { closedAt: new Date() }
          });
        } else if (outcome === "KO_DEFINITIVO") {
          await tx.trattativaEvent.create({
            data: {
              trattativaId: trattativa.id,
              eventType: "KO_DEFINITIVO",
              description: `KO Definitivo. Motivazione: ${outcomeNotes}`,
              userId: tlId,
              userRole: tlRole,
            }
          });
          await tx.trattativaSheet.update({
            where: { id: trattativa.id },
            data: { closedAt: new Date() }
          });
        } else if (outcome === "RICHIAMO_OPERATORE" || outcome === "RICHIAMO_COMMERCIALE") {
          await tx.trattativaEvent.create({
            data: {
              trattativaId: trattativa.id,
              eventType: "RICHIAMO_IMPOSTATO",
              description: `Prossimo tentativo fissato per il ${new Date(nextDate).toLocaleDateString('it-IT')} alle ${nextTime} (Assegnato a: ${outcome === 'RICHIAMO_COMMERCIALE' ? 'Commerciale' : 'Operatore'}). Note: ${outcomeNotes}`,
              userId: tlId,
              userRole: tlRole,
            }
          });
        }
      }

      return trattativa;
    });

    return NextResponse.json({ success: true, trattativa: result });
  } catch (error: any) {
    console.error("Wizard Trattativa error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
