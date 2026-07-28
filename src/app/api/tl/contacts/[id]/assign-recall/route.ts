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

    const { assigneeId, assigneeRole, blockHours, notes } = await req.json();

    if (!assigneeId || !assigneeRole || !notes) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
    }

    const tlId = (session.user as any).id;

    // 1. Gestione blocco (hiddenUntil)
    let newHiddenUntil = contact.hiddenUntil;
    const now = new Date();
    
    // Se non è bloccato (o il blocco è scaduto), impostiamo il nuovo blocco in base alle ore scelte dalla TL
    if (!newHiddenUntil || newHiddenUntil < now) {
      const hours = blockHours ? parseInt(blockHours) : 24;
      newHiddenUntil = new Date(now.getTime() + hours * 60 * 60 * 1000);
    }

    await prisma.$transaction(async (tx) => {
      // Aggiorna il contatto
      await tx.contact.update({
        where: { id },
        data: {
          assignedToId: assigneeId,
          hiddenUntil: newHiddenUntil,
          isKo: false,
          isPersonalCallback: assigneeRole === "OPERATORE",
        }
      });

      if (assigneeRole === "OPERATORE") {
        // Crea Negotiation per l'operatore
        const expiresAt = new Date(newHiddenUntil);
        expiresAt.setDate(expiresAt.getDate() + 7); // Scadenza di default 7 giorni dopo il blocco

        await tx.negotiation.create({
          data: {
            contactId: id,
            operatorId: assigneeId,
            recallDate: newHiddenUntil,
            reason: "[TL_REQUEST] " + notes,
            isApproved: true,
            expiresAt: expiresAt,
          }
        });
      } else if (assigneeRole === "COMMERCIALE") {
        // Crea un Appointment DA_GESTIRE_COMMERCIALE per il commerciale
        await tx.appointment.create({
          data: {
            contactId: id,
            operatorId: tlId, // La TL figura come chi l'ha creato
            commercialeId: assigneeId,
            date: newHiddenUntil, // Usiamo la data di blocco come placeholder, anche se è DA_GESTIRE
            isPhoneAppt: false,
            isApproved: true,
            referentName: contact.referentName || "N/D",
            referentRole: contact.referentRole || "N/D",
            phone: contact.originalPhone || "N/D",
            clientNeeds: "Richiamo Assegnato Direttamente da TL",
            tlNotes: notes,
            status: "DA_GESTIRE_COMMERCIALE"
          }
        });
      }

      // Log dell'azione
      await tx.activityLog.create({
        data: {
          userId: tlId,
          contactId: id,
          action: "TL_ASSIGNED_RECALL",
          details: `Contatto assegnato in gestione a ${assigneeRole === "OPERATORE" ? "Operatore" : "Commerciale"}. Motivazione: ${notes}`
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST assign recall error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
