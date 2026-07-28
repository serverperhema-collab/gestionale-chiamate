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

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        activityLogs: {
          include: {
            user: { select: { name: true, role: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        appointments: {
          include: {
            operator: { select: { name: true } },
            commerciale: { select: { name: true } },
            outcomes: true
          },
          orderBy: { createdAt: "desc" }
        },
        koRecords: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!contact) {
      return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error("GET contact logs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
