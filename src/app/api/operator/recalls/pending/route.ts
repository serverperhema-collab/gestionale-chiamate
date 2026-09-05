import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const now = new Date();

    // LEGACY
    const legacyRecalls = await prisma.negotiation.findMany({
      where: {
        operatorId: userId,
        isAbandoned: false,
        isExpired: false,
        recallDate: { lte: now },
        contact: { isKo: false }
      },
      include: {
        contact: { select: { id: true, name: true, originalPhone: true, cap: true } }
      }
    });

    // NUOVO SISTEMA
    const newRecalls = await prisma.trattativaSheet.findMany({
      where: {
        currentOperatorId: userId,
        status: "RICHIAMO_PERSONALE",
        nextActionType: "RICHIAMO",
        nextActionDate: { lte: now, not: null },
        closedAt: null
      },
      include: {
        contact: { select: { id: true, name: true, originalPhone: true, cap: true } }
      }
    });

    // Mappiamo le nuove ST per sembrare Negotiations legacy nel frontend (o gestiamo ibrido)
    const mappedNewRecalls = newRecalls.map(st => ({
      id: st.id, // trattativaId
      isNewSystem: true,
      contactId: st.contactId,
      recallDate: st.nextActionDate,
      notes: st.outcomeNotes,
      contact: st.contact
    }));

    const allRecalls = [...legacyRecalls, ...mappedNewRecalls].sort((a, b) => 
      new Date(a.recallDate as any).getTime() - new Date(b.recallDate as any).getTime()
    );

    return NextResponse.json({ recalls: allRecalls });
  } catch (error) {
    console.error("GET pending recalls error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, minutes, isNewSystem } = await req.json();
    if (!id || !minutes) {
      return NextResponse.json({ error: "Dati insufficienti" }, { status: 400 });
    }

    const newRecallDate = new Date();
    newRecallDate.setMinutes(newRecallDate.getMinutes() + parseInt(minutes));

    if (isNewSystem) {
      const updated = await prisma.trattativaSheet.update({
        where: { id },
        data: { nextActionDate: newRecallDate, version: { increment: 1 } }
      });
      return NextResponse.json({ success: true, recall: updated });
    } else {
      const updated = await prisma.negotiation.update({
        where: { id },
        data: { recallDate: newRecallDate }
      });
      return NextResponse.json({ success: true, recall: updated });
    }
  } catch (error) {
    console.error("PATCH postpone recall error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}