import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const { jobId } = params;

    // Recuperiamo tutte le query del job che appartengono al Quadtree (hanno un geoCellId)
    const cells = await prisma.scrapingQuery.findMany({
      where: {
        jobId,
        geoCellId: { not: null }
      },
      select: {
        id: true,
        geoCellId: true,
        parentGeoCellId: true,
        geoDepth: true,
        cellMinLat: true,
        cellMaxLat: true,
        cellMinLng: true,
        cellMaxLng: true,
        searchCenterLat: true,
        searchCenterLng: true,
        searchRadius: true,
        status: true,
        resultCount: true,
        newResultCount: true,
        actualYield: true,
        strategy: true,
        priority: true,
        plannerReason: true,
        queryText: true
      },
      orderBy: {
        geoDepth: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: cells
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

