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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get all operators
    const operators = await prisma.user.findMany({
      where: { role: "OPERATORE", isActive: true },
      select: { id: true, name: true, username: true }
    });

    // Get today's assignments
    const assignments = await prisma.dailyAssignment.findMany({
      where: { date: startOfDay },
    });

    const data = operators.map(op => {
      const assignment = assignments.find(a => a.userId === op.id);
      return {
        ...op,
        assignment: assignment || null
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET assignments error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, cap, campaign } = body;

    if (!userId || !cap || !campaign) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const assignment = await prisma.dailyAssignment.upsert({
      where: {
        userId_date: {
          userId,
          date: startOfDay
        }
      },
      update: {
        cap,
        campaign
      },
      create: {
        userId,
        date: startOfDay,
        cap,
        campaign
      }
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error("POST assignment error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
