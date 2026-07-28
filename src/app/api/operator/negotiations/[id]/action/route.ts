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
    const { action } = await req.json();

    const negotiation = await prisma.negotiation.findUnique({ where: { id } });
    if (!negotiation) {
      return NextResponse.json({ error: "Trattativa non trovata" }, { status: 404 });
    }

    // L'operatore può agire solo sulle proprie trattative
    if (negotiation.operatorId !== userId) {
      return NextResponse.json({ error: "Azione non consentita su trattative altrui" }, { status: 403 });
    }

    if (action === "ABANDON") {
      // Abbandona: la trattativa viene marcata come abbandonata
      // e il contatto torna libero nel calderone (hiddenUntil = null, assignedToId = null)
      await prisma.$transaction([
        prisma.negotiation.update({
          where: { id },
          data: { isAbandoned: true }
        }),
        prisma.contact.update({
          where: { id: negotiation.contactId },
          data: { hiddenUntil: null, assignedToId: null }
        })
      ]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
  } catch (error) {
    console.error("POST negotiation action error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
