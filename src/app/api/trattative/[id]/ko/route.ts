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

    const userId = (session.user as any).id;
    const userName = (session.user as any).name || "Operatore";
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

    // Decide who gets the notification
    await prisma.$transaction(async (tx) => {
      // 1. Create Timeline Event
      await tx.trattativaEvent.create({
        data: {
          trattativaId: id,
          userId: userId,
          userRole: (session.user as any).role,
          eventType: "NOTA_AGGIUNTA",
          description: `Chiamato il ${dateStr} alle ore ${timeStr}. Il cliente non è più interessato. Note: ${notes}`,
          metadata: {}
        }
      });

      // 2. Change Trattativa Status
      await tx.trattativaSheet.update({
        where: { id },
        data: {
          status: "SOSPESA", // SOSPESA makes sense for waiting approval
          version: { increment: 1 }
        }
      });

      // 3. Lock the Contact for 5 years and mark as KO
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

      // 4. Create KoRecord for TL Approval
      await tx.koRecord.create({
        data: {
          contactId: trattativa.contactId,
          frozenUntil: frozenUntil,
          isResolved: false
        }
      });

      // 5. Send Notification
      const notifTitle = "CONTATTO MANDATO KO";
      const notifMessage = `La trattativa con ${trattativa.contact.name} è stata mandata in KO da ${userName}. Motivo: ${notes}`;
      // const notifMetadata = { type: "TRATTATIVA_KO", trattativaId: id, contactId: trattativa.contactId };

      if (trattativa.currentCommercialeId) {
        // Send to Commerciale
        await tx.notification.create({
          data: {
            userId: trattativa.currentCommercialeId,
            title: notifTitle,
            message: notifMessage,
            contactId: trattativa.contactId
          }
        });
      } else {
        // Send to ALL Team Leaders
        const tls = await tx.user.findMany({ where: { role: "TEAM_LEADER" } });
        for (const tl of tls) {
          await tx.notification.create({
            data: {
              userId: tl.id,
              title: notifTitle,
            message: notifMessage,
            contactId: trattativa.contactId
            }
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Errore KO trattativa:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

