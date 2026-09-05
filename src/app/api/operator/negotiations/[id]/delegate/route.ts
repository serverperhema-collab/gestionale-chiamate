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
    const { targetOperatorId, durationDays, isNewSystem } = await req.json();

    if (!targetOperatorId) {
      return NextResponse.json({ error: "Nessun operatore di destinazione specificato" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetOperatorId } });
    if (!targetUser || targetUser.role !== "OPERATORE" || !targetUser.isActive) {
      return NextResponse.json({ error: "Operatore di destinazione non valido" }, { status: 400 });
    }

    const delegatedUntil = durationDays ? new Date(Date.now() + parseInt(durationDays) * 24 * 60 * 60 * 1000) : null;

    if (isNewSystem) {
      const st = await prisma.trattativaSheet.findUnique({ where: { id } });
      if (!st) return NextResponse.json({ error: "ST non trovata" }, { status: 404 });
      if (st.currentOperatorId !== userId) return NextResponse.json({ error: "Azione non consentita" }, { status: 403 });

      await prisma.$transaction([
        prisma.trattativaSheet.update({
          where: { id },
          data: { 
            currentOperatorId: targetOperatorId,
            version: { increment: 1 }
          }
        }),
        prisma.contact.update({
          where: { id: st.contactId },
          data: { 
            assignedToId: targetOperatorId,
            delegatedToId: targetOperatorId,
            delegatedUntil: delegatedUntil
          }
        })
      ]);
      return NextResponse.json({ success: true });
    }

    const negotiation = await prisma.negotiation.findUnique({ where: { id } });
    if (!negotiation) {
      return NextResponse.json({ error: "Trattativa non trovata" }, { status: 404 });
    }

    if (negotiation.operatorId !== userId) {
      return NextResponse.json({ error: "Azione non consentita" }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.negotiation.update({
        where: { id },
        data: { 
          operatorId: targetOperatorId,
          originalOperatorId: negotiation.originalOperatorId || userId
        }
      }),
      prisma.contact.update({
        where: { id: negotiation.contactId },
        data: { 
          assignedToId: targetOperatorId,
          delegatedToId: targetOperatorId,
          delegatedUntil: delegatedUntil
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST delegate error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}