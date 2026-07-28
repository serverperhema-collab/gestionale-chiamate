import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { validateCommercialTransition } from "@/lib/commercialStateMachine";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id; // appointmentOutcome ID
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { action } = await req.json(); // "APPROVE" | "REJECT"

    const outcome = await prisma.appointmentOutcome.findUnique({
      where: { id },
      include: { appointment: true }
    });

    if (!outcome) {
      return NextResponse.json({ error: "Esito non trovato" }, { status: 404 });
    }

    const appointment = outcome.appointment;

    if (!["SALTATO_CLIENTE_KO_RICHIESTO", "SALTATO_COMMERCIALE_KO_RICHIESTO"].includes(appointment.commercialStatus || "")) {
       return NextResponse.json({ error: "Questo appuntamento non è in attesa di decisione KO" }, { status: 400 });
    }

    const nextStatus = action === "APPROVE" ? "KO" : "ASSEGNATO";

    if (!validateCommercialTransition(appointment.commercialStatus, nextStatus)) {
      return NextResponse.json({ error: "Transizione di stato non valida" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
       await tx.appointment.update({
         where: { id: appointment.id },
         data: { commercialStatus: nextStatus }
       });

       if (action === "APPROVE") {
         await tx.contact.update({
           where: { id: appointment.contactId },
           data: { isKo: true, assignedToId: null, hiddenUntil: null }
         });

         const frozenUntilDate = new Date();
         frozenUntilDate.setMonth(frozenUntilDate.getMonth() + 3);
         await tx.koRecord.create({
           data: { contactId: appointment.contactId, frozenUntil: frozenUntilDate }
         });
         
         // Log
         await tx.activityLog.create({
           data: {
             userId: (session.user as any).id,
             contactId: appointment.contactId,
             action: "TL_KO_APPROVED",
             details: "KO richiesto dal commerciale APPROVATO dalla TL"
           }
         });
       } else {
         // REJECT - Rimettere in lavorazione (lo togliamo dal commerciale per rifissarlo?)
         // Sì, togliamo assignedToId e lo rimettiamo libero, o lo ridiamo all'operatore originale.
         // Ridiamolo all'operatore originario se c'è
         await tx.contact.update({
           where: { id: appointment.contactId },
           data: { assignedToId: appointment.operatorId, hiddenUntil: null }
         });

         await tx.activityLog.create({
           data: {
             userId: (session.user as any).id,
             contactId: appointment.contactId,
             action: "TL_KO_REJECTED",
             details: "KO richiesto dal commerciale RIFIUTATO dalla TL"
           }
         });
       }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH ko outcome error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
