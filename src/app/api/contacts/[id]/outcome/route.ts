import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OPERATORE", "TEAM_LEADER"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id as string;
    const { id: contactId } = await params;
    const body = await req.json();
    const { outcome, notes, skipUntil, delayDurationObj } = body;

    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Calcolo HiddenUntil
    let newHiddenUntil: Date | null = null;
    let newNoAnswerCount = contact.noAnswerCount;
    let newNotAvailableCount = contact.notAvailableCount || 0;
    let isKo = contact.isKo;

    if (outcome === "NO_ANSWER") {
      newNoAnswerCount += 1;
      newHiddenUntil = new Date();
      if (newNoAnswerCount === 1) {
        newHiddenUntil.setMinutes(newHiddenUntil.getMinutes() + 10);
      } else if (newNoAnswerCount === 2) {
        newHiddenUntil.setHours(newHiddenUntil.getHours() + 1);
      } else {
        newHiddenUntil.setHours(newHiddenUntil.getHours() + 4);
      }
    } else if (outcome === "NOT_AVAILABLE") {
      newNotAvailableCount += 1;
      newHiddenUntil = new Date();
      if (newNotAvailableCount === 1) {
        newHiddenUntil.setHours(newHiddenUntil.getHours() + 4);
      } else if (newNotAvailableCount === 2) {
        newHiddenUntil.setHours(newHiddenUntil.getHours() + 24);
      } else {
        newHiddenUntil.setHours(newHiddenUntil.getHours() + 48);
      }
    } else if (outcome === "SKIP") {
      newHiddenUntil = skipUntil ? new Date(skipUntil) : new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours default
    } else if (outcome === "WRONG_NUMBER" || outcome === "NOT_INTERESTED") {
      newHiddenUntil = new Date();
      newHiddenUntil.setDate(newHiddenUntil.getDate() + 90);
    } else if (outcome === "NON_INTERESSATO") {
      newHiddenUntil = new Date();
      if (delayDurationObj) {
        if (delayDurationObj.unit === "hours") {
          newHiddenUntil.setHours(newHiddenUntil.getHours() + delayDurationObj.value);
        } else if (delayDurationObj.unit === "days") {
          newHiddenUntil.setDate(newHiddenUntil.getDate() + delayDurationObj.value);
        } else if (delayDurationObj.unit === "months") {
          newHiddenUntil.setMonth(newHiddenUntil.getMonth() + delayDurationObj.value);
        }
      } else {
        newHiddenUntil.setMonth(newHiddenUntil.getMonth() + 3);
      }
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
          notAvailableCount: newNotAvailableCount,
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