import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Carica il record e verifica che appartenga a un OPERATORE
    const record = await (prisma as any).attendance.findUnique({
      where: { id },
      include: { user: { select: { role: true } } },
    });

    if (!record) {
      return NextResponse.json({ error: "Record non trovato" }, { status: 404 });
    }

    // AUTORIZZAZIONE: solo presenze di operatori gestibili
    if (record.user.role !== "OPERATORE") {
      return NextResponse.json({ error: "Non autorizzato a eliminare questo record" }, { status: 403 });
    }

    await (prisma as any).attendance.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE attendance error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}

