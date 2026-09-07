import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, notes } = body;

    const agenda = await prisma.zoneAgenda.findUnique({
      where: { id }
    });

    if (!agenda) return NextResponse.json({ error: "Agenda not found" }, { status: 404 });

    const updateData: any = {};
    if (action === "UPDATE_NOTES") {
      updateData.tlNotes = notes;
    } else {
      updateData.isClosed = !agenda.isClosed;
    }

    const updatedAgenda = await prisma.zoneAgenda.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, agenda: updatedAgenda });
  } catch (error: any) {
    console.error("PATCH close agenda error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
