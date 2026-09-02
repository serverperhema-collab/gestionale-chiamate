import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OPERATORE", "TEAM_LEADER"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        phones: true,
        appointments: {
          include: { operator: true, commerciale: true, outcomes: true },
          orderBy: { date: 'desc' }
        },
        negotiations: {
          include: { operator: true },
          orderBy: { createdAt: 'desc' }
        },
        activityLogs: {
          where: {
            action: { not: "PESCATO DAL CALDERONE" }
          },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    return NextResponse.json({ contact });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
