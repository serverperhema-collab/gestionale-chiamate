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
