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

    const body = await req.json();
    const { type } = body;

    const updateData: any = {};
    if (type === "SKIP") {
      updateData.skipLockedUntil = null;
      updateData.skipCount = 0; // Reset
    } else if (type === "MOD") {
      updateData.modLockedUntil = null;
      updateData.dailyModifications = 0; // Reset
    } else if (type === "NO_ANSWER") {
      updateData.noAnswerLockedUntil = null;
    } else if (type === "NOT_AVAILABLE") {
      updateData.notAvailableLockedUntil = null;
    } else {
      // type === "ALL" or undefined
      updateData.skipLockedUntil = null;
      updateData.skipCount = 0;
      updateData.modLockedUntil = null;
      updateData.dailyModifications = 0;
      updateData.noAnswerLockedUntil = null;
      updateData.notAvailableLockedUntil = null;
      updateData.isSuspended = false;
    }

    await prisma.user.update({
      where: { id: id },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST unlock error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
