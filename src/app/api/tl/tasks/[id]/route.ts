import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const task = await prisma.tlTask.findUnique({ where: { id } });
    if (!task || task.tlId !== (session.user as any).id) {
      return NextResponse.json({ error: "Task non trovato o non autorizzato" }, { status: 404 });
    }

    await prisma.tlTask.update({
      where: { id },
      data: { isCompleted: true }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH tl task error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
