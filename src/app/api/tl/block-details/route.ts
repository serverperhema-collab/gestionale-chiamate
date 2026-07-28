import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId || !type) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let logs: any[] = [];
    
    // Fetch logs based on block type
    if (type === 'SKIP') {
      const takeCount = user.maxSkip || 3;
      const recentSkips = await prisma.activityLog.findMany({
        where: { userId: userId, action: "CONTACT_SKIPPED" },
        orderBy: { createdAt: 'desc' },
        take: takeCount,
        include: { contact: { select: { name: true, id: true } } }
      });
      logs = recentSkips.map(l => ({
        id: l.id,
        date: l.createdAt,
        contactName: l.contact?.name || "Sconosciuto",
        notes: l.details
      }));
    } else if (type === 'NO_ANSWER') {
      const takeCount = user.maxNoAnswer || 10;
      const recent = await prisma.callLog.findMany({
        where: { userId: userId, outcome: "NO_ANSWER" },
        orderBy: { createdAt: 'desc' },
        take: takeCount,
        include: { contact: { select: { name: true, id: true } } }
      });
      logs = recent.map(l => ({
        id: l.id,
        date: l.createdAt,
        contactName: l.contact?.name || "Sconosciuto",
        notes: l.notes || "Nessuna nota"
      }));
    } else if (type === 'NOT_AVAILABLE') {
      const takeCount = user.maxNotAvailable || 10;
      const recent = await prisma.callLog.findMany({
        where: { userId: userId, outcome: "NOT_AVAILABLE" },
        orderBy: { createdAt: 'desc' },
        take: takeCount,
        include: { contact: { select: { name: true, id: true } } }
      });
      logs = recent.map(l => ({
        id: l.id,
        date: l.createdAt,
        contactName: l.contact?.name || "Sconosciuto",
        notes: l.notes || "Nessuna nota"
      }));
    } else if (type === 'MOD_LOCK') {
      const takeCount = user.maxDailyModifications || 5;
      const recent = await prisma.activityLog.findMany({
        where: { userId: userId, action: "MODIFIED_EXISTING_DATA" },
        orderBy: { createdAt: 'desc' },
        take: takeCount,
        include: { contact: { select: { name: true, id: true } } }
      });
      logs = recent.map(l => ({
        id: l.id,
        date: l.createdAt,
        contactName: l.contact?.name || "Sconosciuto",
        notes: l.details
      }));
    }

    return NextResponse.json({ logs });

  } catch (error) {
    console.error("GET block-details error:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
