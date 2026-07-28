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
    const filter = searchParams.get("filter") || "all"; // 'expired', 'active', 'all'

    let whereClause: any = { isResolved: false };
    
    if (filter === "expired") {
      whereClause.frozenUntil = { lte: new Date() };
    } else if (filter === "active") {
      whereClause.frozenUntil = { gt: new Date() };
    }

    const records = await prisma.koRecord.findMany({
      where: whereClause,
      include: {
        contact: {
          select: { id: true, name: true, cap: true, address: true, isKo: true }
        }
      },
      orderBy: { frozenUntil: "asc" }
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("GET ko-records error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
