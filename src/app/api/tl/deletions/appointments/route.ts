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

    const cancelledAppointments = await prisma.appointment.findMany({
      where: {
        status: "CANCELLED"
      },
      include: {
        contact: true,
        operator: true,
        commerciale: true
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return NextResponse.json({ appointments: cancelledAppointments });
  } catch (error) {
    console.error("GET cancelled appointments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
