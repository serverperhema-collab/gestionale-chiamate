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
    const { action, targetUserId, durationDays, isNewSystem } = await req.json();

    if (isNewSystem) {
      const st = await prisma.trattativaSheet.findUnique({ where: { id } });
      if (!st) return NextResponse.json({ error: "ST non trovata" }, { status: 404 });
      if (st.currentOperatorId !== userId && st.createdByOperatorId !== userId) {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
      }

      if (action === "ABANDON") {
        await prisma.trattativaSheet.update({
          where: { id },
          data: { status: "CHIUSA_PERSA", closedAt: new Date(), outcomeNotes: "Abbandonata dall'operatore", nextActionType: "NONE", nextActionDate: null, version: { increment: 1 } }
        });
        await prisma.contact.update({
          where: { id: st.contactId },
          data: { hiddenUntil: null, assignedToId: null }
        });
        return NextResponse.json({ success: true });
      }

      if (action === "DELEGATE") {
        // Simple swap of currentOperatorId for new system
        await prisma.trattativaSheet.update({
          where: { id },
          data: { currentOperatorId: targetUserId, version: { increment: 1 } }
        });
        return NextResponse.json({ success: true });
      }

      if (action === "REVOKE") {
        await prisma.trattativaSheet.update({
          where: { id },
          data: { currentOperatorId: st.createdByOperatorId, version: { increment: 1 } }
        });
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ error: "Azione non valida per ST" }, { status: 400 });
    }

    const negotiation = await prisma.negotiation.findUnique({ where: { id } });
    if (!negotiation) {
      return NextResponse.json({ error: "Trattativa non trovata" }, { status: 404 });
    }

    if (negotiation.operatorId !== userId && negotiation.originalOperatorId !== userId) {
      return NextResponse.json({ error: "Azione non consentita su trattative altrui" }, { status: 403 });
    }

    if (action === "ABANDON") {
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