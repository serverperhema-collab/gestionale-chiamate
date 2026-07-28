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

    const { searchParams } = new URL(req.url);
    const cap = searchParams.get("cap");

    if (!cap) {
      return NextResponse.json({ error: "CAP richiesto" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const agendas = await prisma.zoneAgenda.findMany({
      where: {
        date: {
          gte: today
        },
        caps: {
          has: cap
        }
      },
      orderBy: {
        date: "asc"
      }
    });

    return NextResponse.json({ agendas });
  } catch (error) {
    console.error("GET dates error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
