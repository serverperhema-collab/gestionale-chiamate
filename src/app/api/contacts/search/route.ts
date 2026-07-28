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
    const q = searchParams.get("q");

    if (!q || q.length < 3) {
      return NextResponse.json({ contacts: [] });
    }

    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { originalPhone: { contains: q } },
          { id: { equals: q } }
        ]
      },
      take: 10,
      select: { id: true, name: true, originalPhone: true, cap: true }
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("GET search contacts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
