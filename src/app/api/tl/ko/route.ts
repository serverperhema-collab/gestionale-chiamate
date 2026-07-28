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

    const records = await prisma.koRecord.findMany({
      where: { isResolved: false },
      include: {
        contact: { select: { id: true, name: true, cap: true, originalPhone: true } },
      },
      orderBy: { frozenUntil: "asc" }
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("GET KO error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, action } = await req.json(); // action can be "UNLOCK" or "ARCHIVE"
    if (!id || !action) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const record = await prisma.koRecord.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json({ error: "Record KO non trovato" }, { status: 404 });
    }

    if (action === "UNLOCK") {
      // Sblocca: toglie il flag isKo e resetta hiddenUntil e noAnswerCount, lo rimette nel calderone vergine
      await prisma.$transaction([
        prisma.contact.update({
          where: { id: record.contactId },
          data: { isKo: false, hiddenUntil: null, noAnswerCount: 0 }
        }),
        prisma.koRecord.update({
          where: { id },
          data: { isResolved: true, resolvedAt: new Date() }
        })
      ]);
    } else if (action === "ARCHIVE") {
      // Archivia: rimane in isKo per sempre, lo risolvo solo dal punto di vista dell'interfaccia KO
      await prisma.koRecord.update({
        where: { id },
        data: { isResolved: true, resolvedAt: new Date() }
      });
    } else {
      return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH KO error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
