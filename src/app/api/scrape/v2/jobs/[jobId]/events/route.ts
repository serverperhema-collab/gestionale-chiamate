import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Cerca gli ScrapingJobEvent del job, orderBy timestamp desc, take 50
    const events = await prisma.scrapingJobEvent.findMany({
      where: { jobId },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    return NextResponse.json({
      success: true,
      data: events
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


