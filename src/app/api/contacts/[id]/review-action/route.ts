import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const tlId = (session.user as any).id;
    const tlName = (session.user as any).name;
    const body = await req.json();
    const { actionType, note, newDate, newOperatorId, delayMins } = body;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        appointments: { where: { status: { in: ["PENDING", "CONFIRMED"] } } },
        negotiations: { where: { isAbandoned: false } }
      }
    });

    if (!contact) {
      return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
    }

    const baseUpdate: any = {
      reviewRequestedAt: null,
      reviewNote: null,
    };

    if (note) {
      baseUpdate.notes = contact.notes ? `${contact.notes}\n[TL ${tlName}]: ${note}` : `[TL ${tlName}]: ${note}`;
    }

    const txs: any[] = [];
    let logMessage = `Azione TL (${actionType}) completata.`;

    // 1. LEAVE_WITH_NOTE
    if (actionType === "LEAVE_WITH_NOTE") {
      logMessage = `TL ha mantenuto l'assegnazione attuale. Nota: ${note}`;
      txs.push(prisma.contact.update({ where: { id }, data: baseUpdate }));
    } 
    // 2. RESCHEDULE_APP
    else if (actionType === "RESCHEDULE_APP") {
      if (!newDate) return NextResponse.json({ error: "Data mancante" }, { status: 400 });
      if (contact.appointments.length === 0) return NextResponse.json({ error: "Nessun appuntamento attivo da spostare" }, { status: 400 });
      
      const app = contact.appointments[0];
      txs.push(prisma.appointment.update({
        where: { id: app.id },
        data: { date: new Date(newDate) }
      }));
      txs.push(prisma.contact.update({ where: { id }, data: baseUpdate }));
      logMessage = `TL ha spostato l'appuntamento al ${new Date(newDate).toLocaleString('it-IT')}. Nota: ${note}`;
    }
    // 3. DOWNGRADE_TO_RECALL
    else if (actionType === "DOWNGRADE_TO_RECALL") {
      if (contact.appointments.length === 0) return NextResponse.json({ error: "Nessun appuntamento attivo da annullare" }, { status: 400 });
      
      const app = contact.appointments[0];
      txs.push(prisma.appointment.update({
        where: { id: app.id },
        data: { status: "CANCELLED" }
      }));
      txs.push(prisma.negotiation.create({
        data: {
          contactId: id,
          operatorId: app.operatorId,
          recallDate: new Date(),
          reason: `Declassato da appuntamento annullato dalla TL. Nota TL: ${note || "Nessuna nota"}`,
          isApproved: true
        }
      }));
      txs.push(prisma.contact.update({ 
        where: { id }, 
        data: { 
          ...baseUpdate,
          assignedToId: app.operatorId, // Assign to the original operator just in case
          hiddenUntil: null // Clear hidden if any
        } 
      }));
      logMessage = `TL ha annullato l'appuntamento e convertito in Richiamo Personale per l'operatore. Nota: ${note}`;
    }
    // 4. REASSIGN_NEGOTIATION
    else if (actionType === "REASSIGN_NEGOTIATION") {
      if (!newOperatorId) return NextResponse.json({ error: "Operatore mancante" }, { status: 400 });
      if (contact.negotiations.length === 0) return NextResponse.json({ error: "Nessuna trattativa attiva da riassegnare" }, { status: 400 });
      
      const neg = contact.negotiations[0];
      txs.push(prisma.negotiation.update({
        where: { id: neg.id },
        data: { operatorId: newOperatorId }
      }));
      txs.push(prisma.contact.update({ 
        where: { id }, 
        data: { 
          ...baseUpdate,
          assignedToId: newOperatorId 
        } 
      }));
      logMessage = `TL ha riassegnato la trattativa a un altro operatore. Nota: ${note}`;
    }
    // 5. CANCEL_AND_CALDERONE
    else if (actionType === "CANCEL_AND_CALDERONE") {
      const delay = parseInt(delayMins, 10);
      if (isNaN(delay)) return NextResponse.json({ error: "Ritardo non valido" }, { status: 400 });

      if (contact.appointments.length > 0) {
        txs.push(prisma.appointment.update({
          where: { id: contact.appointments[0].id },
          data: { status: "CANCELLED" }
        }));
      }
      if (contact.negotiations.length > 0) {
        txs.push(prisma.negotiation.update({
          where: { id: contact.negotiations[0].id },
          data: { isAbandoned: true }
        }));
      }

      txs.push(prisma.contact.update({ 
        where: { id }, 
        data: { 
          ...baseUpdate,
          assignedToId: null,
          hiddenUntil: delay > 0 ? new Date(Date.now() + delay * 60 * 1000) : null,
          delegatedToId: null,
          delegatedUntil: null
        } 
      }));
      logMessage = `TL ha annullato i blocchi attivi e rimandato il contatto nel Calderone (nascosto per ${delay} min). Nota: ${note}`;
    }
    // 6. RESTORE (Ripristina nel calderone dopo richiesta eliminazione)
    else if (actionType === "RESTORE") {
      logMessage = `TL ha rifiutato l'eliminazione e ripristinato il contatto nel calderone. Nota: ${note}`;
      txs.push(prisma.contact.update({ 
        where: { id }, 
        data: { 
          ...baseUpdate,
          hiddenUntil: null // Togli dal cestino
        } 
      }));
    }
    // 7. BLACKLIST (Conferma cestinamento)
    else if (actionType === "BLACKLIST") {
      logMessage = `TL ha confermato l'eliminazione. Spostato in Blacklist (Cestino Permanente). Nota: ${note}`;
      txs.push(prisma.contact.update({ 
        where: { id }, 
        data: { 
          ...baseUpdate,
          isKo: true,
          blacklisted: true,
          blacklistReason: note || "Cestinato da TL",
          hiddenUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Nascosto per 1 anno e filtrato
        } 
      }));
    }
    else {
      return NextResponse.json({ error: "Azione non supportata" }, { status: 400 });
    }

    // Resolve any pending deletion request for this contact
    txs.push(prisma.deletionRequest.updateMany({
      where: { contactId: id, isResolved: false },
      data: { isResolved: true }
    }));

    // Always create activity log
    txs.push(prisma.activityLog.create({
      data: {
        userId: tlId,
        contactId: id,
        action: "TL_APPOINTMENT_ACTION",
        details: logMessage
      }
    }));

    await prisma.$transaction(txs);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST review action error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
