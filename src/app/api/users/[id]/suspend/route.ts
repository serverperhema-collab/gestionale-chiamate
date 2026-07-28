import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: id },
      data: { isSuspended: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST suspend error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
