import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id as string;
    const { id: contactId } = await params;
    const body = await req.json();
    const { outcome, notes, skipUntil } = body;

    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Calcolo HiddenUntil
    let newHiddenUntil: Date | null = null;
    let newNoAnswerCount = contact.noAnswerCount;
    let isKo = contact.isKo;

    if (outcome === "NO_ANSWER") {
      newNoAnswerCount += 1;
      if (newNoAnswerCount >= 3) {
        newHiddenUntil = new Date();
        newHiddenUntil.setDate(newHiddenUntil.getDate() + 90); // 90 days block
      } else {
        newHiddenUntil = new Date();
        newHiddenUntil.setHours(newHiddenUntil.getHours() + 2); // 2 hours block
      }
    } else if (outcome === "NOT_AVAILABLE") {
      newHiddenUntil = new Date();
      newHiddenUntil.setDate(newHiddenUntil.getDate() + 1); // 1 day block
      newHiddenUntil.setHours(9, 0, 0, 0); // next morning
    } else if (outcome === "SKIP") {
      newHiddenUntil = skipUntil ? new Date(skipUntil) : new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours default
    } else if (outcome === "WRONG_NUMBER" || outcome === "NOT_INTERESTED") {
      newHiddenUntil = new Date();
      newHiddenUntil.setDate(newHiddenUntil.getDate() + 90);
    }

    await prisma.$transaction([
      prisma.callLog.create({
        data: {
          contactId,
          userId,
          outcome,
          notes: notes || ""
        }
      }),
      prisma.contact.update({
        where: { id: contactId },
        data: {
          assignedToId: null, // Release from Calderone
          hiddenUntil: newHiddenUntil,
          noAnswerCount: newNoAnswerCount,
          isKo,
          lastOutcome: outcome
        }
      })
    ]);

    // Update user activity
    await prisma.user.update({
      where: { id: userId },
      data: { lastActivityAt: new Date() }
    });

    return NextResponse.json({ success: true, hiddenUntil: newHiddenUntil });

  } catch (error) {
    console.error("Outcome error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}