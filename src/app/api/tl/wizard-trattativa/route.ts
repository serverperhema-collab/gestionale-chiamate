import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { TrattativaService } from "@/lib/services/TrattativaService";
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

    const service = new TrattativaService();
    const eventDateTime = new Date(`${eventDate}T${eventTime}`);

    // 1. Create the base Trattativa
    let trattativaStatus = "TRATTATIVA_IN_CORSO" as any;
    
    if (!isPast) {
      // Event in future
      if (eventType === "TELEFONO") trattativaStatus = "RICHIAMO_PERSONALE";
      if (eventType === "APPUNTAMENTO") trattativaStatus = "APPUNTAMENTO";
    } else {
      // Event in past, rely on outcome
      if (outcome === "RICHIAMO_OPERATORE") trattativaStatus = "RICHIAMO_PERSONALE";
      if (outcome === "RICHIAMO_COMMERCIALE") trattativaStatus = "TRATTATIVA_IN_CORSO";
      if (outcome === "CONTRATTO_FIRMATO") trattativaStatus = "CHIUSA_VINTA";
      if (outcome === "KO_DEFINITIVO") trattativaStatus = "CHIUSA_PERSA";
    }

    const trattativa = await prisma.trattativaSheet.create({
      data: {
        contactId,
        status: trattativaStatus,
        currentOperatorId: operatorId,
        currentCommercialeId: commercialeId || null,
        nextActionType: (!isPast || outcome === "RICHIAMO_OPERATORE" || outcome === "RICHIAMO_COMMERCIALE") ? "RICHIAMO" : "NONE",
        nextActionDate: isPast ? (nextDate && nextTime ? new Date(`${nextDate}T${nextTime}`) : null) : eventDateTime
      }
    });

    // 2. Insert initial note
    const tl = await prisma.user.findUnique({ where: { id: tlId } });
    
    let initialDesc = "";
    if (eventType === "TELEFONO") {
      initialDesc = `Il ${new Date(eventDate).toLocaleDateString('it-IT')} alle ore ${eventTime} è avvenuto un contatto telefonico.\nNote: ${eventNotes}`;
    } else {
      initialDesc = `Il ${new Date(eventDate).toLocaleDateString('it-IT')} alle ore ${eventTime} è stato fissato un appuntamento.\nNote: ${eventNotes}`;
    }
    
    await prisma.trattativaEvent.create({
      data: {
        trattativaId: trattativa.id,
        eventType: "NOTA_AGGIUNTA",
        description: `Trattativa generata da TL (${tl?.name}). ${initialDesc}`,
        userId: tlId,
        userRole: tlRole,
      }
    });

    // 3. Preventivo
    if (preventivo) {
      await prisma.trattativaEvent.create({
        data: {
          trattativaId: trattativa.id,
          eventType: "PREVENTIVO_INVIATO",
          description: `Il giorno ${new Date(preventivo.date).toLocaleDateString('it-IT')} da ${preventivo.by} è stato inviato un preventivo al cliente. Note: ${preventivo.notes || 'nessuna'}`,
          userId: tlId,
          userRole: tlRole,
        }
      });
    }

    // 4. Outcome logic (if past)
    if (isPast && outcome) {
      if (outcome === "CONTRATTO_FIRMATO") {
        await prisma.trattativaEvent.create({
          data: {
            trattativaId: trattativa.id,
            eventType: "CONTRATTO_FIRMATA",
            description: `Contratto Firmato. Note: ${outcomeNotes}`,
            userId: tlId,
            userRole: tlRole,
          }
        });
        await prisma.trattativaSheet.update({
          where: { id: trattativa.id },
          data: { closedAt: new Date(),  }
        });
      } else if (outcome === "KO_DEFINITIVO") {
        await prisma.trattativaEvent.create({
          data: {
            trattativaId: trattativa.id,
            eventType: "KO_PERSO",
            description: `KO Definitivo. Motivazione: ${outcomeNotes}`,
            userId: tlId,
            userRole: tlRole,
          }
        });
        await prisma.trattativaSheet.update({
          where: { id: trattativa.id },
          data: { closedAt: new Date(),  }
        });
      } else if (outcome === "RICHIAMO_OPERATORE" || outcome === "RICHIAMO_COMMERCIALE") {
        await prisma.trattativaEvent.create({
          data: {
            trattativaId: trattativa.id,
            eventType: "NOTA_AGGIUNTA",
            description: `Prossimo tentativo fissato per il ${new Date(nextDate).toLocaleDateString('it-IT')} alle ${nextTime} (Assegnato a: ${outcome === 'RICHIAMO_COMMERCIALE' ? 'Commerciale' : 'Operatore'}). Note: ${outcomeNotes}`,
            userId: tlId,
            userRole: tlRole,
          }
        });
      }
    }

    return NextResponse.json({ success: true, trattativa });
  } catch (error: any) {
    console.error("Wizard Trattativa error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
