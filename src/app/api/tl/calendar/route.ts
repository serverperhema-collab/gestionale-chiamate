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

    const agendas = await prisma.zoneAgenda.findMany({
      include: {
        commerciale: { select: { name: true, username: true } },
        trattativaAppointments: { select: { id: true } }
      },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json({ agendas });
  } catch (error: any) {
    console.error("GET calendar agendas error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { date, caps } = body;

    if (!date || !caps || !Array.isArray(caps) || caps.length === 0) {
      return NextResponse.json({ error: "Missing date or caps" }, { status: 400 });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Trova il mapping per il primo CAP per assegnare un nome all'agenda (come descritto nel setting page)
    const mapping = await prisma.capZoneMapping.findUnique({
      where: { cap: caps[0] }
    });
    
    const name = mapping ? mapping.zoneName : "Nuova Agenda";

    const agenda = await prisma.zoneAgenda.create({
      data: {
        date: targetDate,
        name,
        caps
      }
    });

    return NextResponse.json({ success: true, agenda });
  } catch (error: any) {
    console.error("POST calendar agenda error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, caps } = body;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const updateData: any = {};
    if (name) updateData.name = name;
    if (caps && Array.isArray(caps)) updateData.caps = caps;

    const agenda = await prisma.zoneAgenda.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, agenda });
  } catch (error: any) {
    console.error("PATCH calendar agenda error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const agenda = await prisma.zoneAgenda.findUnique({
      where: { id },
      include: { trattativaAppointments: true }
    });

    if (!agenda) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (agenda.trattativaAppointments.length > 0) {
      return NextResponse.json({ error: "Non puoi eliminare un'agenda con appuntamenti" }, { status: 400 });
    }

    await prisma.zoneAgenda.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE calendar agenda error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
