import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QueryStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const url = new URL(request.url);
    
    // Pagination
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    // Filters
    const status = url.searchParams.get('status') as QueryStatus | null;
    const strategy = url.searchParams.get('strategy');
    const geoDepth = url.searchParams.get('geoDepth') ? parseInt(url.searchParams.get('geoDepth')!) : null;
    const familyId = url.searchParams.get('familyId');

    // Sorting
    const sortField = url.searchParams.get('sortBy') || 'createdAt';
    const sortDir = url.searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';

    const where: any = { jobId };
    if (status) where.status = status;
    if (strategy) where.strategy = strategy;
    if (geoDepth !== null) where.geoDepth = geoDepth;
    if (familyId) where.familyId = familyId;

    const [totalCount, queries] = await prisma.$transaction([
      prisma.scrapingQuery.count({ where }),
      prisma.scrapingQuery.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortField]: sortDir }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalCount,
        page,
        pageSize,
        queries
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
