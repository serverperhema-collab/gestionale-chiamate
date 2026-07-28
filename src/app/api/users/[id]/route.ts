import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { password, isActive, name, role, maxDeroghe, maxDerogheHours } = body;

    const dataToUpdate: any = {};
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }
    if (typeof isActive === "boolean") {
      dataToUpdate.isActive = isActive;
    }
    if (name) {
      dataToUpdate.name = name;
    }
    if (role) {
      dataToUpdate.role = role;
    }
    if (typeof maxDeroghe === "number") {
      dataToUpdate.maxDeroghe = maxDeroghe;
    }
    if (typeof maxDerogheHours === "number") {
      dataToUpdate.maxDerogheHours = maxDerogheHours;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "Nessun dato da aggiornare" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: { id: true, name: true, username: true, role: true, isActive: true }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("PATCH user error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
