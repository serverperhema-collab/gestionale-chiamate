import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["OPERATORE", "TEAM_LEADER"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const cap = searchParams.get('cap');

    if (!cap) return NextResponse.json({ error: "Missing cap parameter" }, { status: 400 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allAgendas = await prisma.zoneAgenda.findMany({
      where: {
        isClosed: false,
        date: { gte: today }
      },
      orderBy: { date: 'asc' }
    });

    // Filtriamo in memoria o tramite jsonb/array (Prisma non ha has in sqlite, ma qui siamo su postgres, 
    // potremmo usare { caps: { has: cap } }, ma per sicurezza dato il tipo String[] senza has in alcune versioni facciamo fallback o usiamo has)
    // Poichè Prisma postgresql array ha `has`, facciamo il findMany base e filtriamo. E' molto veloce per le agende aperte.
    const agendas = allAgendas.filter(a => a.caps.includes(cap));

    return NextResponse.json({ agendas });
  } catch (error: any) {
    console.error("GET agendas by cap error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
