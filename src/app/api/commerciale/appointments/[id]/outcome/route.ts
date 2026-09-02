import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { validateCommercialTransition } from "@/lib/commercialStateMachine";
import { CommercialStatus, SkipReason, NextActionTarget, NextActionType, OutcomeFinal } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "COMMERCIALE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const commercialeId = (session.user as any).id;
    const body = await req.json();
    const { 
      notes, 
      skipReason, 
      koRequested, 
      nextActionDate, 
      outcomeFinal, 
      quoteRequested, 
      quoteNotes, 
      quoteUrl, 
      quoteAttached, 
      nextActionType, 
      nextActionTarget, 
      wantsToFixAppt 
    } = body;

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 });
    }
    if (appointment.commercialeId !== commercialeId) {
      return NextResponse.json({ error: "Non sei autorizzato a modificare questo appuntamento" }, { status: 403 });
    }

    // Determine target CommercialStatus
    let nextStatus: CommercialStatus;
    
    if (skipReason) {
      // Flow SALTATO
      if (skipReason === "SALTATO_CLIENTE") {
        nextStatus = koRequested ? "SALTATO_CLIENTE_KO_RICHIESTO" : "SALTATO_CLIENTE_DA_RIFISSARE";
      } else {
        nextStatus = koRequested ? "SALTATO_COMMERCIALE_KO_RICHIESTO" : "SALTATO_COMMERCIALE_DA_RIFISSARE";
      }
    } else {
      // Flow SVOLTO
      if (outcomeFinal === "KO") {
        nextStatus = "KO";
      } else if (outcomeFinal === "VENDUTO") {
        nextStatus = "VENDUTO";
      } else if (quoteRequested || quoteAttached) {
        nextStatus = "PREVENTIVO_IN_CORSO";
      } else if (nextActionType) {
        nextStatus = "FOLLOW_UP";
      } else {
        nextStatus = "VISITATO"; // default fallback
      }
    }

    // Validate Transition
    if (!validateCommercialTransition(appointment.commercialStatus, nextStatus)) {
      return NextResponse.json({ error: `Transizione di stato non valida da ${appointment.commercialStatus || 'NUOVO'} a ${nextStatus}` }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Crea l'esito
      const outcomeData: any = {
        appointmentId: id,
        notes,
        koRequested: koRequested || false,
        quoteAttached: quoteAttached || false,
        quoteUrl: quoteUrl || null,
        quoteRequested: quoteRequested || false,
      };

      if (outcomeFinal) outcomeData.outcomeFinal = outcomeFinal;
      if (skipReason) outcomeData.skipReason = skipReason;
      if (nextActionType) outcomeData.nextActionType = nextActionType;
      if (nextActionTarget) outcomeData.nextActionTarget = nextActionTarget;
      if (nextActionDate) outcomeData.nextActionDate = new Date(nextActionDate);

      if (!outcomeFinal) {
         outcomeData.outcomeFinal = "FOLLOWUP"; // placeholder for Prisma schema requirement
      }

      const createdOutcome = await tx.appointmentOutcome.upsert({
        where: { appointmentId: id },
        update: outcomeData,
        create: outcomeData
      });

      // 2. Crea QuoteRequest se richiesto
      if (quoteRequested && quoteNotes) {
        await tx.quoteRequest.upsert({
          where: { appointmentId: id },
          update: {
            commercialeId,
            notes: quoteNotes
          },
          create: {
            appointmentId: id,
            commercialeId,
            notes: quoteNotes
          }
        });
      }

      // 3. Aggiorna l'appuntamento
      await tx.appointment.update({
        where: { id },
        data: { 
          status: "DONE",
          commercialStatus: nextStatus 
        }
      });

      // 4. Gestione Contatto
      if (nextStatus === "KO") {
        await tx.contact.update({
          where: { id: appointment.contactId },
          data: { isKo: true, assignedToId: null, hiddenUntil: null }
        });
        const frozenUntilDate = new Date();
        frozenUntilDate.setMonth(frozenUntilDate.getMonth() + 3);
        await tx.koRecord.create({
          data: { contactId: appointment.contactId, frozenUntil: frozenUntilDate }
        });
      } else if (skipReason && koRequested) {
        // TL decide
      } else if (skipReason && !koRequested) {
        await tx.contact.update({
          where: { id: appointment.contactId },
          data: { hiddenUntil: new Date(nextActionDate) }
        });
      } else if (nextActionType === "RICHIAMO" && nextActionTarget === "OPERATORE") {
        await tx.contact.update({
          where: { id: appointment.contactId },
          data: { assignedToId: appointment.operatorId, hiddenUntil: new Date(nextActionDate) }
        });
      } else if (nextActionType === "RICHIAMO" && nextActionTarget === "COMMERCIALE") {
        await tx.contact.update({
          where: { id: appointment.contactId },
          data: { hiddenUntil: new Date(nextActionDate), assignedToId: null }
        });
        
        // FIX: Crea un nuovo record Appuntamento in stato DA_GESTIRE_COMMERCIALE
        // in modo che appaia nella tab "Da Gestire" del Commerciale!
        await tx.appointment.create({
          data: {
            contactId: appointment.contactId,
            operatorId: appointment.operatorId,
            commercialeId: commercialeId,
            date: new Date(nextActionDate),
            status: "DA_GESTIRE_COMMERCIALE",
            commercialStatus: "ASSEGNATO",
            tlNotes: "Richiamo Personale generato da precedente esito.",
          referentName: appointment.referentName || "",
          referentRole: appointment.referentRole || "",
          phone: appointment.phone || "",
          clientNeeds: appointment.clientNeeds || "Richiamo"
          }
        });
      }

      // Log
      await tx.activityLog.create({
        data: {
          userId: commercialeId,
          contactId: appointment.contactId,
          action: "COMMERCIALE_OUTCOME_SAVED",
          details: `Esito registrato. Nuovo stato: ${nextStatus}`
        }
      });
    });

    return NextResponse.json({ success: true, nextStatus });
  } catch (error: any) {
    console.error("POST outcome error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
