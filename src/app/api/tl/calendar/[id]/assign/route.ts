import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { commercialeId } = body;

    // Assegna il commerciale all'agenda
    const agenda = await prisma.zoneAgenda.update({
      where: { id },
      data: { commercialeId }
    });

    // Assegna il commerciale anche a tutti gli appuntamenti legati a questa agenda
    if (commercialeId) {
      const appointments = await prisma.trattativaAppointment.findMany({
        where: { zoneAgendaId: id }
      });
      
      if (appointments.length > 0) {
        // Aggiorna sia il commercialeId sull'appuntamento, sia il currentCommercialeId sulla TrattativaSheet
        const apptIds = appointments.map(a => a.id);
        const sheetIds = appointments.map(a => a.trattativaId);
        
        await prisma.trattativaAppointment.updateMany({
          where: { id: { in: apptIds } },
          data: { commercialeId }
        });
        
        await prisma.trattativaSheet.updateMany({
          where: { id: { in: sheetIds } },
          data: { currentCommercialeId: commercialeId }
        });
      }
    } else {
      // Se viene rimosso (commercialeId è null)
      const appointments = await prisma.trattativaAppointment.findMany({
        where: { zoneAgendaId: id }
      });
      if (appointments.length > 0) {
        const apptIds = appointments.map(a => a.id);
        const sheetIds = appointments.map(a => a.trattativaId);
        
        await prisma.trattativaAppointment.updateMany({
          where: { id: { in: apptIds } },
          data: { commercialeId: null }
        });
        
        await prisma.trattativaSheet.updateMany({
          where: { id: { in: sheetIds } },
          data: { currentCommercialeId: null }
        });
      }
    }

    return NextResponse.json({ success: true, agenda });
  } catch (error: any) {
    console.error("POST assign commerciale error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
