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

    const tlId = (session.user as any).id;

    const contacts = await prisma.contact.findMany({
      where: {
        assignedToId: tlId,
        isPersonalCallback: true
      },
      orderBy: { updatedAt: "desc" },
      include: {
        phones: true
      }
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("GET tl callbacks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
