import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== "OPERATORE" && userRole !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { contactId } = body;

    if (!contactId) {
      return NextResponse.json({ error: "contactId è obbligatorio" }, { status: 400 });
    }

    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    });

    if (!contact) {
      return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
    }

    // Ricontrolla che il contatto non sia bloccato
    const now = new Date();
    const isBlocked = 
      contact.isKo || 
      contact.blacklisted || 
      (contact.hiddenUntil && contact.hiddenUntil > now) ||
      (contact.assignedToId && contact.assignedToId !== userId);

    if (isBlocked) {
      return NextResponse.json({ error: "Il contatto è attualmente in blocco o assegnato a un altro operatore e non può essere acquisito." }, { status: 403 });
    }

    // Se l'utente è un operatore, prima rilascia eventuali altri contatti correnti
    if (userRole === "OPERATORE") {
      await prisma.contact.updateMany({
        where: { assignedToId: userId, id: { not: contactId } },
        data: { assignedToId: null }
      });
    }

    // Assegna il contatto all'operatore e pulisci la delega
    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        assignedToId: userId,
        delegatedToId: null,
        delegatedUntil: null
      }
    });

    await prisma.activityLog.create({
      data: {
        userId,
        contactId,
        action: "CONTACT_MANUALLY_ASSIGNED",
        details: "Contatto esistente ri-assegnato tramite inserimento manuale (fuzzy match)"
      }
    });

    return NextResponse.json({ success: true, contact: updatedContact });

  } catch (error) {
    console.error("POST assign existing contact error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
