import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    
    // 1. Carica il ScrapingJob
    const job = await prisma.scrapingJob.findUnique({
      where: { id: jobId },
      include: {
        queries: true
      }
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    let newContacts = 0;
    let duplicateContacts = 0;
    let pendingQueries = 0;

    const closedQueries = [];

    for (const q of job.queries) {
      // Conta i totali
      newContacts += q.newResultCount || 0;
      duplicateContacts += q.duplicateCount || 0;
      
      if (q.status === 'PENDING') {
        pendingQueries++;
      } else if (q.status !== 'RUNNING' && q.status !== 'FAILED') {
        closedQueries.push(q);
      }
    }

    // yieldUltime5: prendi le ultime 5 query chiuse per questo jobId
    closedQueries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const last5 = closedQueries.slice(0, 5);
    
    let sumYield = 0;
    let sumNewForYield = 0;
    last5.forEach(q => {
      sumYield += q.actualYield || 0;
      sumNewForYield += q.newResultCount || 0;
    });
    const avgYield = last5.length > 0 ? sumYield / last5.length : 0;

    return NextResponse.json({
      success: true,
      data: {
        job,
        newContacts,
        duplicateContacts,
        googleContacts: 0, // Mock for now
        osmContacts: 0, // Mock for now
        yieldUltime5: {
          avgYield,
          newContacts: sumNewForYield
        },
        pendingQueries
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
