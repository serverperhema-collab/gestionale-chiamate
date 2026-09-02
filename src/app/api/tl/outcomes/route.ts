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
    const commercialeId = searchParams.get("commercialeId");
    
    let whereClause: any = {
      status: { notIn: ["CANCELLED"] }
    };
    
    if (commercialeId) {
      whereClause.commercialeId = commercialeId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        contact: { select: { id: true, name: true, cap: true, address: true, originalPhone: true } },
        commerciale: { select: { id: true, name: true } },
        operator: { select: { id: true, name: true } },
        outcomes: true // This contains the outcome if it exists
      },
      orderBy: { date: "desc" },
      take: 500
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("GET appointments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
