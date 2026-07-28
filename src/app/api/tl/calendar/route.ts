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
      orderBy: { date: "asc" }
    });

    return NextResponse.json({ agendas });
  } catch (error) {
    console.error("GET calendar error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { date, caps } = await req.json();

    if (!date || !caps || caps.length === 0) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Get city from CAP
    let zoneName = `Zona ${caps[0]}`;
    try {
      const mapping = await prisma.capZoneMapping.findUnique({
        where: { cap: caps[0] }
      });
      
      if (mapping) {
        zoneName = mapping.zoneName;
      } else {
        // Fallback to OSM
        const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${caps[0]}&country=Italy&format=json`, {
          headers: { 'User-Agent': 'CRM-App-Zonizzazione' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0 && data[0].display_name) {
            const parts = data[0].display_name.split(',').map((p: string) => p.trim());
            if (parts.length >= 3) {
              zoneName = `${parts[1]}, ${parts[2]}`;
            } else if (parts.length >= 2) {
              zoneName = parts[1];
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch city for CAP", e);
    }

    const agenda = await prisma.zoneAgenda.create({
      data: {
        date: targetDate,
        name: zoneName,
        caps
      }
    });

    return NextResponse.json({ success: true, agenda });
  } catch (error) {
    console.error("POST calendar error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 });

    await prisma.zoneAgenda.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE calendar error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, name, caps } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID mancante" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (caps !== undefined) dataToUpdate.caps = caps;

    const agenda = await prisma.zoneAgenda.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, agenda });
  } catch (error) {
    console.error("PATCH calendar error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
