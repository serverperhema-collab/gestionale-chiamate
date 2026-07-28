import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const deletions = await prisma.deletionRequest.findMany({
      where: { isResolved: false },
      orderBy: { createdAt: "asc" }
    });

    const contactIds = [...new Set(deletions.map(d => d.contactId))];
    const contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds } },
      select: { id: true, name: true, cap: true, originalPhone: true, address: true }
    });
    
    const contactMap = contacts.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as any);

    // Per recuperare i nomi degli operatori, fetch a parte
    const operatorIds = [...new Set(deletions.map(d => d.operatorId))];
    const operators = await prisma.user.findMany({
      where: { id: { in: operatorIds } },
      select: { id: true, name: true }
    });
    
    const operatorMap = operators.reduce((acc, op) => ({ ...acc, [op.id]: op.name }), {} as any);

    const formattedDeletions = deletions.map(d => ({
      ...d,
      contact: contactMap[d.contactId] || { name: "Sconosciuto" },
      operatorName: operatorMap[d.operatorId] || "Sconosciuto"
    }));

    return NextResponse.json({ deletions: formattedDeletions });
  } catch (error) {
    console.error("GET deletions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, action } = await req.json(); // action can be "APPROVE" or "REJECT"
    if (!id || !action) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const deletion = await prisma.deletionRequest.findUnique({ where: { id } });
    if (!deletion) {
      return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });
    }

    if (action === "APPROVE") {
      // Imposta il contatto in KO
      await prisma.$transaction([
        prisma.contact.update({
          where: { id: deletion.contactId },
          data: { isKo: true, hiddenUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) } // Nascosto per sicurezza, ma isKo = true è il check principale
        }),
        prisma.deletionRequest.update({
          where: { id },
          data: { isResolved: true, isApproved: true, resolvedAt: new Date() }
        })
      ]);
    } else if (action === "REJECT") {
      // Rimette in circolo (tolgo hiddenUntil)
      await prisma.$transaction([
        prisma.contact.update({
          where: { id: deletion.contactId },
          data: { hiddenUntil: null }
        }),
        prisma.deletionRequest.update({
          where: { id },
          data: { isResolved: true, isApproved: false, resolvedAt: new Date() }
        })
      ]);
    } else {
      return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH deletions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
