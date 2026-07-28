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
    
    let dateFilter: any = {};
    if (dateStr) {
      const start = new Date(dateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateStr); // istanza separata per evitare mutazione
      end.setHours(23, 59, 59, 999);
      dateFilter = { gte: start, lt: end };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { gte: today };
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        commercialeId: commercialeId,
        date: dateFilter,
        // Solo quelli non cancellati né già lavorati
        status: {
          in: ["PENDING", "CONFIRMED", "NOT_CONFIRMED", "DA_GESTIRE_COMMERCIALE"] 
        }
      },
      include: {
        contact: {
          select: { id: true, name: true, cap: true, address: true, originalPhone: true }
        },
        operator: { select: { id: true, name: true } },
        commerciale: { select: { id: true, name: true } }
      },
      orderBy: { date: "asc" }
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("GET commerciale appointments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
