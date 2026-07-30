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

    const reviews = await prisma.contact.findMany({
      where: {
        reviewRequestedAt: { not: null }
      },
      select: {
        id: true,
        name: true,
        cap: true,
        originalPhone: true,
        address: true,
        reviewRequestedAt: true,
        reviewNote: true
      },
      orderBy: {
        reviewRequestedAt: "asc"
      }
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("GET tl reviews error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, action } = await req.json(); // action can be "RESTORE" or "BLACKLIST"
    if (!id || !action) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
    }

    const tlId = (session.user as any).id;

    if (action === "RESTORE") {
      // Ripristina nel calderone (rimuovi note di revisione e hiddenUntil)
      await prisma.$transaction([
        prisma.contact.update({
          where: { id },
          data: {
            reviewRequestedAt: null,
            reviewNote: null,
            hiddenUntil: null
          }
        }),
        prisma.activityLog.create({
          data: {
            userId: tlId,
            contactId: id,
            action: "CONTACT_REVIEW_RESOLVED",
            details: "Contatto ripristinato nel calderone dopo revisione TL"
          }
        })
      ]);
    } else if (action === "BLACKLIST") {
      // Elimina definitivamente e sposta nel cestino permanente (blacklist)
      await prisma.$transaction([
        prisma.contact.update({
          where: { id },
          data: {
            reviewRequestedAt: null,
            reviewNote: null,
            isKo: true,
            blacklisted: true,
            blacklistReason: contact.reviewNote || "Eliminato dopo revisione TL",
            hiddenUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Nascosto per 1 anno (e filtrato da blacklist)
          }
        }),
        prisma.activityLog.create({
          data: {
            userId: tlId,
            contactId: id,
            action: "CONTACT_REVIEW_BLACKLISTED",
            details: `Contatto inserito in Blacklist dopo revisione TL. Motivo: ${contact.reviewNote}`
          }
        })
      ]);
    } else {
      return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH tl reviews error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}