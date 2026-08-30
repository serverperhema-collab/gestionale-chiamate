import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    // Cerca la prima ScrapingQuery del job con stato PENDING, orderBy priority desc
    const query = await prisma.scrapingQuery.findFirst({
      where: {
        jobId,
        status: 'PENDING'
      },
      orderBy: {
        priority: 'desc'
      },
      select: {
        id: true,
        queryText: true,
        strategy: true,
        priority: true,
        plannerReason: true,
        status: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: query
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
