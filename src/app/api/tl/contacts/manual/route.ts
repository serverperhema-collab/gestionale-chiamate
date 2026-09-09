import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, originalPhone, cap, sector, address, email, referentName, notes } = body;

    if (!name || !cap || !sector) {
      return NextResponse.json({ error: "Nome, CAP e Settore sono obbligatori" }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        originalPhone,
        cap,
        sector,
        address,
        email,
        referentName,
        notes,
        source: "MANUAL",
        sourceId: `MANUAL_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        phones: originalPhone ? {
          create: [{ phone: originalPhone, label: "Principale" }]
        } : undefined
      }
    });

    return NextResponse.json({ contact });
  } catch (error) {
    console.error("POST manual contact error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
