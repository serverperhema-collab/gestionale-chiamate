import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const cancelledAppointments = await prisma.trattativaAppointment.findMany({
      where: {
        status: "ANNULLATO"
      },
      include: {
        trattativa: {
          include: {
            contact: true,
            currentOperator: { select: { name: true } }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    const mapped = cancelledAppointments.map(app => ({
      id: app.id,
      contact: app.trattativa.contact,
      operator: { name: app.trattativa.currentOperator?.name || "Sconosciuto" },
      tlNotes: "Annullato tramite Trattativa (Nessuna nota specifica registrata sull'appuntamento)"
    }));

    return NextResponse.json({ appointments: mapped });
  } catch (error: any) {
    console.error("GET deletions/appointments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
