import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { commercialeId } = body; // Can be a string ID or null

    const agenda = await prisma.zoneAgenda.findUnique({ where: { id } });
    if (!agenda) {
      return NextResponse.json({ error: "Agenda non trovata" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Assign to the agenda
      await tx.zoneAgenda.update({
        where: { id },
        data: { commercialeId }
      });

      // 2. Update all appointments linked to this agenda to match the commercialeId
      await tx.appointment.updateMany({
        where: { zoneAgendaId: id },
        data: { commercialeId }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST assign commerciale to agenda error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
