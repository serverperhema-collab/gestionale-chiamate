import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const { targetOperatorId } = await req.json();

    if (!targetOperatorId) {
      return NextResponse.json({ error: "Nessun operatore di destinazione specificato" }, { status: 400 });
    }

    const negotiation = await prisma.negotiation.findUnique({ where: { id } });
    if (!negotiation) {
      return NextResponse.json({ error: "Trattativa non trovata" }, { status: 404 });
    }

    // L'operatore può agire solo sulle proprie trattative
    if (negotiation.operatorId !== userId) {
      return NextResponse.json({ error: "Azione non consentita" }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetOperatorId } });
    if (!targetUser || targetUser.role !== "OPERATORE" || !targetUser.isActive) {
      return NextResponse.json({ error: "Operatore di destinazione non valido" }, { status: 400 });
    }

    // Effettua la delega
    await prisma.$transaction([
      prisma.negotiation.update({
        where: { id },
        data: { 
          operatorId: targetOperatorId,
          // Imposta originalOperatorId solo se non è già stato delegato prima (mantiene il primissimo)
          originalOperatorId: negotiation.originalOperatorId || userId
        }
      }),
      prisma.contact.update({
        where: { id: negotiation.contactId },
        data: { assignedToId: targetOperatorId }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST delegate error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
