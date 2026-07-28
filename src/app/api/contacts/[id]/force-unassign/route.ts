import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const contact = await prisma.contact.findUnique({
      where: { id },
      select: { assignedToId: true, assignedTo: { select: { name: true } } }
    });

    if (!contact || !contact.assignedToId) {
      return NextResponse.json({ error: "Contatto non trovato o non assegnato" }, { status: 404 });
    }

    const operatorName = contact.assignedTo?.name || "Sconosciuto";

    await prisma.contact.update({
      where: { id },
      data: { assignedToId: null }
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        contactId: id,
        action: "FORCE_UNASSIGN",
        details: `La TL ha rimosso forzatamente l'assegnazione da ${operatorName} per inattività.`
      }
    });

    return NextResponse.json({ success: true, message: "Contatto liberato" });
  } catch (error) {
    console.error("Force unassign error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
