import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const now = new Date();

    const pendingRecalls = await prisma.negotiation.findMany({
      where: {
        operatorId: userId,
        isAbandoned: false,
        isExpired: false,
        recallDate: {
          lte: now
        },
        contact: {
          isKo: false
        }
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            originalPhone: true,
            cap: true
          }
        }
      },
      orderBy: {
        recallDate: "asc"
      }
    });

    return NextResponse.json({ recalls: pendingRecalls });
  } catch (error) {
    console.error("GET pending recalls error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "OPERATORE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, minutes } = await req.json();
    if (!id || !minutes) {
      return NextResponse.json({ error: "Dati insufficienti" }, { status: 400 });
    }

    const newRecallDate = new Date();
    newRecallDate.setMinutes(newRecallDate.getMinutes() + parseInt(minutes));

    const updated = await prisma.negotiation.update({
      where: { id },
      data: {
        recallDate: newRecallDate
      }
    });

    return NextResponse.json({ success: true, recall: updated });
  } catch (error) {
    console.error("PATCH postpone recall error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
