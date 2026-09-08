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
    const dateStr = now.toLocaleDateString('it-IT');
    const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    // Decide who gets the notification
    if (trattativa.currentCommercialeId) {
        // Send to Commerciale
        await tx.notification.create({
          data: {
            userId: trattativa.currentCommercialeId,
            type: "TRATTATIVA_KO",
            title: notifTitle,
            message: notifMessage,
            metadata: notifMetadata
          }
        });
      } else {
        // Send to ALL Team Leaders
        const tls = await tx.user.findMany({ where: { role: "TEAM_LEADER" } });
        for (const tl of tls) {
          await tx.notification.create({
            data: {
              userId: tl.id,
              type: "TRATTATIVA_KO",
              title: notifTitle,
              message: notifMessage,
              metadata: notifMetadata
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
