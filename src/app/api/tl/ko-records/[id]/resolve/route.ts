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

    const body = await req.json();
    const { action } = body; // "RESTORE" o "ARCHIVE"

    const koRecord = await prisma.koRecord.findUnique({ where: { id } });
    if (!koRecord) {
      return NextResponse.json({ error: "Record non trovato" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Risolvi il record KO
      await tx.koRecord.update({
        where: { id },
        data: {
          isResolved: true,
          resolvedAt: new Date()
        }
      });

      // 2. Chiudi l'eventuale Trattativa in SOSPESA
      const activeSt = await tx.trattativaSheet.findFirst({
        where: { contactId: koRecord.contactId, closedAt: null }
      });
      if (activeSt) {
        await tx.trattativaSheet.update({
          where: { id: activeSt.id },
          data: {
            status: "CHIUSA_PERSA",
            closedAt: new Date(),
            outcomeFinal: action === "ARCHIVE" ? "KO_CONFERMATO_TL" : "KO_ANNULLATO_TL_RIPRISTINATO",
            version: { increment: 1 }
          }
        });
        
        await tx.trattativaEvent.create({
          data: {
            trattativaId: activeSt.id,
            eventType: "CHIUSA",
            description: action === "ARCHIVE" 
              ? "Trattativa chiusa definitivamente dal TL (KO Confermato)" 
              : "Trattativa chiusa dal TL (KO Rifiutato, Contatto rimesso nel calderone)",
            userId: (session.user as any).id,
            userRole: "TEAM_LEADER",
            metadata: {}
          }
        });
      }

      if (action === "RESTORE") {
        // Rimetti nel calderone: isKo = false, assignedToId = null
        await tx.contact.update({
          where: { id: koRecord.contactId },
          data: {
            isKo: false,
            assignedToId: null,
            hiddenUntil: null // Resetta anche l'eventuale hidden
          }
        });
      } else if (action === "ARCHIVE") {
        // Archiviazione permanente: lascialo isKo = true per tenerlo fuori dal calderone, 
        // ed essendo il record KO risolto non comparirà più negli alert
      } else {
        throw new Error("Azione non valida");
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST ko-records resolve error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
