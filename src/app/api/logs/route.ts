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
    const userId = searchParams.get("userId");
    const contactId = searchParams.get("contactId");
    
    const whereClause: any = { action: { not: "CONTACT_EXTRACTED" } };
    if (userId) whereClause.userId = userId;
    if (contactId) whereClause.contactId = contactId;

    const activityLogs = await prisma.activityLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { name: true, role: true } },
        contact: { select: { id: true, originalPhone: true } }
      }
    });

    return NextResponse.json({ logs: activityLogs });
  } catch (error) {
    console.error("GET logs error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

