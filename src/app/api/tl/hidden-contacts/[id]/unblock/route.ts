import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const tlId = (session.user as any).id;

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.contact.update({
        where: { id },
        data: {
          hiddenUntil: null,
          isKo: false,
          assignedToId: null, // Slegato da chiunque
          noAnswerCount: 0 // Azzerato per rimetterlo vergine
        }
      }),
      prisma.activityLog.create({
        data: {
          userId: tlId,
          contactId: id,
          action: "TL_UNBLOCK",
          details: "La TL ha forzato lo sblocco manuale del contatto e resettato il contatore Non Risponde."
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST unblock contact error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
