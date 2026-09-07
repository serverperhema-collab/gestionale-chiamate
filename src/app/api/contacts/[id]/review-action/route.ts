import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const userId = (session.user as any).id;
    const body = await req.json();
    const { actionType, note, newOperatorId } = body;

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      if (actionType === "CANCEL_AND_CALDERONE") {
        await tx.contact.update({
          where: { id },
          data: { hiddenUntil: null, assignedToId: null, isKo: false }
        });
        await tx.activityLog.create({
          data: {
            userId, contactId: id, action: "CONTACT_RESTORED",
            details: `Ripristinato da TL: ${note || ""}`
          }
        });
      } else if (actionType === "LEAVE_WITH_NOTE") {
        await tx.contact.update({
          where: { id },
          data: { hiddenUntil: null }
        });
        await tx.activityLog.create({
          data: {
            userId, contactId: id, action: "TL_NOTE_ADDED",
            details: `Nota TL (Revisione completata): ${note || ""}`
          }
        });
      } else if (actionType === "REASSIGN_NEGOTIATION") {
        await tx.contact.update({
          where: { id },
          data: { hiddenUntil: null, assignedToId: newOperatorId }
        });
        await tx.activityLog.create({
          data: {
            userId, contactId: id, action: "CONTACT_REASSIGNED",
            details: `TL ha riassegnato il contatto. Note: ${note || ""}`
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST review action error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
