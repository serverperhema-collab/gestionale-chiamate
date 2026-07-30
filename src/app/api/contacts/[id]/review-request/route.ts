import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { notes, preserveAssignment } = body;

    if (!notes || notes.trim() === "") {
      return NextResponse.json({ error: "La motivazione della revisione è obbligatoria." }, { status: 400 });
    }

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
    }

    const dataToUpdate: any = {
      reviewRequestedAt: new Date(),
      reviewNote: notes
    };

    if (!preserveAssignment) {
      dataToUpdate.assignedToId = null;
      dataToUpdate.hiddenUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 giorni
    }

    await prisma.$transaction([
      prisma.contact.update({
        where: { id },
        data: dataToUpdate
      }),
      prisma.activityLog.create({
        data: {
          userId,
          contactId: id,
          action: "CONTACT_REVIEW_REQUESTED",
          details: `Richiesta revisione TL: ${notes}${preserveAssignment ? " (senza disassegnazione)" : ""}`
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST review request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}