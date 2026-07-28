import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

function simplifyName(name: string): string {
  return name.toLowerCase()
    .replace(/\b(srl|spa|snc|sas|sapa|srls)\b/g, '') // Rimuovi suffissi legali
    .replace(/[^a-z0-9]/g, '') // Rimuovi spazi e punteggiatura
    .trim();
}

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
    const { name, cap, phone, sector } = body;

    if (!name || !cap) {
      return NextResponse.json({ error: "Nome e CAP sono obbligatori" }, { status: 400 });
    }

    // Fuzzy matching logic per evitare doppioni
    const simplifiedInputName = simplifyName(name);

    // Fetch contacts in the same CAP
    const existingContacts = await prisma.contact.findMany({
      where: { cap }
    });

    const duplicate = existingContacts.find(c => simplifyName(c.name) === simplifiedInputName);

    if (duplicate) {
      return NextResponse.json({ 
        error: `Possibile doppione trovato nel CAP ${cap}: "${duplicate.name}". L'inserimento è stato bloccato.` 
      }, { status: 409 });
    }

    // Se è un operatore, rilascia eventuali altri contatti aperti per evitare che rimangano bloccati nel limbo
    if (userRole === "OPERATORE") {
      await prisma.contact.updateMany({
        where: { assignedToId: userId },
        data: { assignedToId: null }
      });
    }

    // Non è un doppione, possiamo crearlo
    const newContact = await prisma.contact.create({
      data: {
        placeId: `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Pseudo placeId for manual entries
        name,
        cap,
        sector: sector || "Generico",
        originalPhone: phone || null,
        // Se è un operatore a crearlo, glielo assegniamo immediatamente per bloccarlo su di esso
        assignedToId: userRole === "OPERATORE" ? userId : null,
        phones: phone ? {
          create: {
            phone,
            label: "Principale (Manuale)"
          }
        } : undefined
      }
    });

    // Registra nel log l'azione
    await prisma.activityLog.create({
      data: {
        userId,
        contactId: newContact.id,
        action: "CONTACT_MANUALLY_CREATED",
        details: `Creato contatto manualmente: ${name}`
      }
    });

    return NextResponse.json({ success: true, contact: newContact });

  } catch (error) {
    console.error("POST manual contact error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
