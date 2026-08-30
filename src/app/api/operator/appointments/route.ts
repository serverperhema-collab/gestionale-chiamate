import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const operatorId = (session.user as any).id;

    const appointments = await prisma.appointment.findMany({
      where: { operatorId },
      include: {
        outcomes: true,
        contact: {
          select: { id: true, name: true, cap: true, address: true, originalPhone: true }
        },
        commerciale: { select: { id: true, name: true } }
      },
      orderBy: { date: "asc" }
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("GET operator appointments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
