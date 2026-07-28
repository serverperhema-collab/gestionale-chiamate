import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    
    let gte = new Date();
    gte.setHours(0, 0, 0, 0);
    let lt = new Date();
    lt.setHours(23, 59, 59, 999);

    if (dateStr) {
      gte = new Date(dateStr);
      gte.setHours(0, 0, 0, 0);
      lt = new Date(dateStr);
      lt.setHours(23, 59, 59, 999);
    }

    const activityLogs = await prisma.activityLog.findMany({
      where: {
        userId: id,
        createdAt: {
          gte,
          lt
        }
      },
      include: {
        contact: { select: { name: true, id: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ logs: activityLogs });
  } catch (error) {
    console.error("GET operator logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
