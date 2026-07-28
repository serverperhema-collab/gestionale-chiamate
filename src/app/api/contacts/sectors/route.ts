import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sectors = await prisma.contact.findMany({
      select: { sector: true },
      distinct: ['sector'],
      where: {
        sector: { not: '' }
      }
    });

    const uniqueSectors = sectors.map(s => s.sector).filter(Boolean).sort();
    return NextResponse.json(uniqueSectors);
  } catch (error) {
    console.error("Error fetching sectors:", error);
    return NextResponse.json({ error: "Failed to fetch sectors" }, { status: 500 });
  }
}
