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
    const date = searchParams.get("date"); // optional YYYY-MM-DD
    const commercialeId = searchParams.get("commercialeId"); // optional

    let whereClause: any = {
      status: { notIn: ["CANCELLED", "DA_GESTIRE_COMMERCIALE"] }
    };
    if (date) {
      const targetDate = new Date(date);
      whereClause.date = {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lt: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    }
    if (commercialeId) {
      whereClause.commercialeId = commercialeId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        contact: {
          select: { id: true, name: true, cap: true, address: true }
        },
        operator: { select: { id: true, name: true } },
        commerciale: { select: { id: true, name: true } },
        zoneAgenda: { select: { id: true, name: true, caps: true } }
      },
      orderBy: { date: "asc" }
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("GET tl appointments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
