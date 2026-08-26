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

    const blacklistedContacts = await prisma.contact.findMany({
      where: { blacklisted: true },
      select: {
        id: true,
        name: true,
        cap: true,
        address: true,
        originalPhone: true,
        blacklistReason: true
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({ deletions: blacklistedContacts });
  } catch (error) {
    console.error("GET deletions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, action } = await req.json(); // id is contactId now, action is "RESTORE"
    if (!id || action !== "RESTORE") {
      return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
    }

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
    }

    // Rimette in circolo
    await prisma.contact.update({
      where: { id },
      data: { 
        isKo: false,
        blacklisted: false,
        blacklistReason: null,
        hiddenUntil: null 
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH deletions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
