import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const role = (session.user as any).role;
    if (role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Accesso negato. Solo la TL può eseguire questa azione." }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { notes } = body;

    if (!notes || notes.trim() === "") {
      return NextResponse.json({ error: "Note obbligatorie" }, { status: 400 });
    }

    const trattativa = await prisma.trattativaSheet.findUnique({ 
      where: { id },
      include: { contact: true }
    });

    if (!trattativa) {
      return NextResponse.json({ error: "Trattativa non trovata" }, { status: 404 });
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
    const timeStr = now.toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });
    const logDescription = `Il giorno ${dateStr} alle ore ${timeStr} il contatto viene messo ko note ${notes}`;

    await prisma.$transaction(async (tx) => {
      // 1. Create Timeline Event
      await tx.trattativaEvent.create({
        data: {
          trattativaId: id,
          userId: userId,
          userRole: role,
          eventType: "KO_DEFINITIVO",
          description: logDescription,
          metadata: {}
        }
      });

      // 2. Change Trattativa Status
      await tx.trattativaSheet.update({
        where: { id },
        data: {
          status: "CHIUSA_PERSA",
          outcomeFinal: "KO",
          outcomeNotes: notes,
          version: { increment: 1 }
        }
      });

      // 3. Cancel any active appointment (figurativo)
      await tx.trattativaAppointment.updateMany({
        where: {
          trattativaId: id,
          status: { notIn: ["SVOLTO_ESITATO", "ANNULLATO"] }
        },
        data: {
          status: "ANNULLATO"
        }
      });

      // 4. Lock the Contact for 5 years and mark as KO
      const frozenUntil = new Date();
      frozenUntil.setFullYear(frozenUntil.getFullYear() + 5);

      await tx.contact.update({
        where: { id: trattativa.contactId },
        data: {
          assignedToId: null, // Release operator lock
          hiddenUntil: frozenUntil,
          isKo: true
        }
      });

      // 5. Create KoRecord to formalize the KO state
      await tx.koRecord.create({
        data: {
          contactId: trattativa.contactId,
          frozenUntil: frozenUntil,
          isResolved: true // Già approvato dalla TL
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Errore KO diretto TL:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
