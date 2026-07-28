import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id;

    // Verify the contact is assigned to this user
    const contact = await prisma.contact.findUnique({
      where: { id: id }
    });

    if (!contact || contact.assignedToId !== userId) {
      return NextResponse.json({ error: "Contatto non assegnato a te" }, { status: 400 });
    }

    // Release the contact
    await prisma.contact.update({
      where: { id: id },
      data: { assignedToId: null }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("POST release contact error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
