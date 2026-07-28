import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "TEAM_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';
    const sector = searchParams.get('sector') || '';
    const isExport = searchParams.get('export') === 'true';
    
    const skip = (page - 1) * limit;

    const whereCondition: any = {};
    
    if (search) {
      whereCondition.OR = [
        { name: { contains: search } },
        { cap: { contains: search } },
        { sector: { contains: search } }
      ];
    }

    if (sector && sector !== 'Tutti') {
      whereCondition.sector = sector;
    }

    if (isExport) {
      const allContacts = await prisma.contact.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(allContacts);
    }

    const [total, contacts] = await prisma.$transaction([
      prisma.contact.count({ where: whereCondition }),
      prisma.contact.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return NextResponse.json({
      data: contacts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}
