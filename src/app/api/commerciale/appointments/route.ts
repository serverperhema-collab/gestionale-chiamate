import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "COMMERCIALE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const commercialeId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // optional YYYY-MM-DD
    
    let whereClause: any = {
      commercialeId: commercialeId,
      status: { notIn: ["CANCELLED"] }
    };

    if (dateStr) {
      const start = new Date(dateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateStr); 
      end.setHours(23, 59, 59, 999);
      whereClause.date = { gte: start, lt: end };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        contact: {
          select: { id: true, name: true, cap: true, address: true, originalPhone: true }
        },
        operator: { select: { id: true, name: true } },
        commerciale: { select: { id: true, name: true } },
        outcomes: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { date: "asc" }
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("GET commerciale appointments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}