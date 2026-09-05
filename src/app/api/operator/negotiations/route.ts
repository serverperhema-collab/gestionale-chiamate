import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { checkExpiredDelegations } from "@/lib/delegationHelper";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await checkExpiredDelegations();

    const userId = (session.user as any).id;

    // Fetch negotiations assigned to this operator OR delegated by this operator
    const negotiations = await prisma.negotiation.findMany({
      where: { 
        OR: [
          { operatorId: userId },
          { originalOperatorId: userId }
        ],
        isAbandoned: false
      },
      include: {
        contact: {
          select: { id: true, name: true, cap: true, originalPhone: true, address: true, delegatedUntil: true }
        },
        operator: { select: { id: true, name: true } }
      },
      orderBy: { recallDate: "asc" }
    });

    const newSTs = await prisma.trattativaSheet.findMany({
      where: {
        currentOperatorId: userId,
        status: "RICHIAMO_PERSONALE",
        closedAt: null
      },
      include: {
        contact: {
          select: { id: true, name: true, cap: true, originalPhone: true, address: true, delegatedUntil: true }
        },
        currentOperator: { select: { id: true, name: true } }
      }
    });

    const userIdsToFetch = new Set<string>();
    negotiations.forEach(n => {
      if (n.originalOperatorId) userIdsToFetch.add(n.originalOperatorId);
    });

    let originalUsers: Record<string, string> = {};
    if (userIdsToFetch.size > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: Array.from(userIdsToFetch) } },
        select: { id: true, name: true }
      });
      users.forEach(u => originalUsers[u.id] = u.name);
    }

    let mappedNegotiations = negotiations.map(n => ({
      ...n,
      originalOperator: n.originalOperatorId ? { id: n.originalOperatorId, name: originalUsers[n.originalOperatorId] || "Sconosciuto" } : null
    }));

    // Mappiamo le ST per il formato legacy
    const mappedSTs = newSTs.map(st => ({
      id: st.id,
      isNewSystem: true, // Flag per il frontend
      contactId: st.contactId,
      operatorId: st.currentOperatorId,
      recallDate: st.nextActionDate || new Date(), // Se non c'è, mettiamo oggi
      reason: st.outcomeNotes || "Trattativa (Nuovo Sistema)",
      contact: st.contact,
      operator: st.currentOperator,
      originalOperator: null
    }));

    mappedNegotiations = [...mappedNegotiations, ...mappedSTs] as any;
    mappedNegotiations.sort((a, b) => 
      new Date(a.recallDate as any).getTime() - new Date(b.recallDate as any).getTime()
    );

    return NextResponse.json({ 
      negotiations: mappedNegotiations,
      currentUserId: userId 
    });
  } catch (error) {
    console.error("GET operator negotiations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
