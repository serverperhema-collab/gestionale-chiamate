import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { contactId, reason } = await req.json();
    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });

    // Check limits
    const now = new Date();
    const minsAgo = new Date(now.getTime() - user.maxGestioneSeparataMins * 60000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentRequests = await prisma.gestioneSeparataRequest.count({
      where: {
        operatorId: userId,
        createdAt: { gte: minsAgo }
      }
    });

    if (recentRequests >= user.maxGestioneSeparata) {
      return NextResponse.json({ error: `Hai raggiunto il limite di ${user.maxGestioneSeparata} richieste di gestione separata ogni ${user.maxGestioneSeparataMins} minuti.` }, { status: 429 });
    }

    // Check daily limit (hardcoded to 20 or we could add another field, using a simple max of 20 here)
    const dailyRequests = await prisma.gestioneSeparataRequest.count({
      where: {
        operatorId: userId,
        createdAt: { gte: dayAgo }
      }
    });

    if (dailyRequests >= 20) {
      return NextResponse.json({ error: "Hai raggiunto il limite massimo giornaliero di 20 richieste." }, { status: 429 });
    }

    // Ensure it doesn't already exist
    const existing = await prisma.gestioneSeparataRequest.findUnique({ where: { contactId } });
    if (existing && !existing.isResolved) {
      return NextResponse.json({ error: "Richiesta già in sospeso per questo contatto." }, { status: 400 });
    }
    
    // Also ensure contact isn't already isGestioneSeparata
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (contact?.isGestioneSeparata) {
      return NextResponse.json({ error: "Contatto già in Gestione Separata." }, { status: 400 });
    }

    // Create request
    if (existing) {
       await prisma.gestioneSeparataRequest.delete({ where: { contactId } });
    }

    await prisma.gestioneSeparataRequest.create({
      data: {
        contactId,
        operatorId: userId,
        reason
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        contactId,
        action: "GESTIONE_SEPARATA_REQUESTED",
        details: `Richiesta Gestione Separata. Motivo: ${reason}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/contacts/gestione-separata error:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
