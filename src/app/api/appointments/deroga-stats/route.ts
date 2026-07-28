import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const operatorId = (session.user as any).id;
    const user = await prisma.user.findUnique({ where: { id: operatorId } });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hoursAgo = new Date(Date.now() - (user.maxDerogheHours * 60 * 60 * 1000));
    const recentDerogheCount = await prisma.appointment.count({
      where: {
        operatorId,
        isDeroga: true,
        createdAt: { gte: hoursAgo }
      }
    });

    return NextResponse.json({
      maxDeroghe: user.maxDeroghe,
      maxDerogheHours: user.maxDerogheHours,
      usedDeroghe: recentDerogheCount,
      remainingDeroghe: Math.max(0, user.maxDeroghe - recentDerogheCount)
    });
  } catch (error) {
    console.error("GET deroga stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
