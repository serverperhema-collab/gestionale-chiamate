import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const negotiations = await prisma.negotiation.findMany({
      where: { isAbandoned: false },
      include: {
        contact: { select: { name: true, cap: true, originalPhone: true } },
        operator: { select: { name: true } }
      },
      orderBy: { recallDate: "asc" }
    });

    return NextResponse.json({ negotiations });
  } catch (error) {
    console.error("GET negotiations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, action, daysToExpire, rejectNote } = await req.json();
    if (!id || !action) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const negotiation = await prisma.negotiation.findUnique({ where: { id } });
    if (!negotiation) {
      return NextResponse.json({ error: "Trattativa non trovata" }, { status: 404 });
    }

    if (action === "APPROVE") {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (daysToExpire || 7));
      
      await prisma.negotiation.update({
        where: { id },
        data: { isApproved: true, expiresAt }
      });
    } else if (action === "REJECT") {
      if (!rejectNote) {
        return NextResponse.json({ error: "Nota di rifiuto obbligatoria" }, { status: 400 });
      }
      
      const tlId = (session.user as any).id;

      // Se rifiutata, torna in circolo (tolgo hiddenUntil) e creo un log
      await prisma.$transaction([
        prisma.contact.update({
          where: { id: negotiation.contactId },
          data: { hiddenUntil: null }
        }),
        prisma.activityLog.create({
          data: {
            userId: tlId,
            contactId: negotiation.contactId,
            action: "NEGOTIATION_REJECTED",
            details: `Trattativa rifiutata. Motivazione TL: ${rejectNote}`
          }
        }),
        prisma.negotiation.delete({
          where: { id }
        })
      ]);
    } else {
      return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH negotiations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
