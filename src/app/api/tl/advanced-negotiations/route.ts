import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'telefonica' | 'appuntamento'
    const stateGroup = searchParams.get('stateGroup'); // 'IN_GESTIONE' | 'FIRMATE' | 'KO'
    const search = searchParams.get('search') || '';
    const cap = searchParams.get('cap') || '';
    const operatorId = searchParams.get('operatorId') || '';
    const commercialeId = searchParams.get('commercialeId') || '';

    const whereClause: any = {};

    // 1. Filter by type (Telefonica vs Appuntamento)
    if (type === 'telefonica') {
      // NON hanno un appuntamento
      whereClause.appointments = { none: {} };
    } else if (type === 'appuntamento') {
      // HANNO un appuntamento
      whereClause.appointments = { some: {} };
    }

    // 2. Filter by stateGroup
    if (stateGroup === 'IN_GESTIONE') {
      whereClause.status = { notIn: ['CHIUSA_VINTA', 'CHIUSA_PERSA'] };
    } else if (stateGroup === 'FIRMATE') {
      whereClause.status = 'CHIUSA_VINTA';
    } else if (stateGroup === 'KO') {
      whereClause.status = 'CHIUSA_PERSA';
    }

    // 3. Search text (contact name, phone, etc)
    if (search) {
      whereClause.contact = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { originalPhone: { contains: search, mode: 'insensitive' } },
          { referentName: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // 4. CAP filter
    if (cap) {
      whereClause.contact = whereClause.contact || {};
      whereClause.contact.cap = cap;
    }

    // 5. Operator filter
    if (operatorId) {
      whereClause.currentOperatorId = operatorId;
    }

    // 6. Commerciale filter
    if (commercialeId) {
      whereClause.currentCommercialeId = commercialeId;
    }

    const trattative = await prisma.trattativaSheet.findMany({
      where: whereClause,
      include: {
        contact: true,
        currentOperator: { select: { id: true, name: true } },
        currentCommerciale: { select: { id: true, name: true } },
        appointments: {
          orderBy: { date: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 200 // limit to avoid massive payloads
    });

    return NextResponse.json({ success: true, trattative });
  } catch (error: any) {
    console.error("Advanced negotiations API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
