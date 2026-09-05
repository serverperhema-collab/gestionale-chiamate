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

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const commercialeId = searchParams.get("commercialeId");

    let whereClause: any = {
      status: { notIn: ["CANCELLED", "DA_GESTIRE_COMMERCIALE"] }
    };
    let stWhereClause: any = {
      status: { notIn: ["ANNULLATO", "DA_GESTIRE_COMMERCIALE"] }
    };

    if (date) {
      const targetDate = new Date(date);
      const start = new Date(targetDate.setHours(0, 0, 0, 0));
      const end = new Date(targetDate.setHours(23, 59, 59, 999));
      whereClause.date = { gte: start, lt: end };
      stWhereClause.date = { gte: start, lt: end };
    }
    if (commercialeId) {
      whereClause.commercialeId = commercialeId;
      stWhereClause.commercialeId = commercialeId;
    }

    const legacyAppts = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        contact: { select: { id: true, name: true, cap: true, address: true } },
        operator: { select: { id: true, name: true } },
        commerciale: { select: { id: true, name: true } },
        zoneAgenda: { select: { id: true, name: true, caps: true } }
      }
    });

    const newAppts = await prisma.trattativaAppointment.findMany({
      where: stWhereClause,
      include: {
        trattativa: {
          include: {
            contact: { select: { id: true, name: true, cap: true, address: true } },
            currentOperator: { select: { id: true, name: true } },
            currentCommerciale: { select: { id: true, name: true } }
          }
        },
        zoneAgenda: { select: { id: true, name: true, caps: true } }
      }
    });

    const mappedNewAppts = newAppts.map(appt => ({
      id: appt.id,
      isNewSystem: true,
      trattativaId: appt.trattativaId,
      date: appt.date,
      status: appt.status,
      contact: appt.trattativa.contact,
      operator: appt.trattativa.currentOperator,
      commerciale: appt.trattativa.currentCommerciale,
      zoneAgenda: appt.zoneAgenda,
      isDeroga: appt.isPhoneAppt, // appt.trattativa.derogaStatus !== 'NONE'
      referentName: appt.trattativa.referentName,
      phone: appt.trattativa.commercialPhone,
      clientNeeds: appt.trattativa.clientNeeds,
      outcomeFinal: appt.trattativa.outcomeFinal,
      outcomeNotes: appt.trattativa.outcomeNotes
    }));

    const allAppts = [...legacyAppts, ...mappedNewAppts].sort((a, b) => 
      new Date(a.date as any).getTime() - new Date(b.date as any).getTime()
    );

    return NextResponse.json({ appointments: allAppts });
  } catch (error) {
    console.error("GET tl appointments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}