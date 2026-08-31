import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const job = await prisma.scrapingJob.findUnique({
        where: { id: jobId }
    });
    if (!job) return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });

    // Carica le QueryFamily coinvolte in questo Job con le loro QueryStrategyStat
    const families = await prisma.queryFamily.findMany({
      where: {
        queries: { some: { jobId: jobId } }
      },
      include: {
        QueryStrategyStat: true
      }
    });

    // Calcoliamo i costi direttamente dalle query del job aggregate per strategia
    const costAggregations = await prisma.scrapingQuery.groupBy({
        by: ['familyId', 'strategy'],
        where: { jobId },
        _sum: {
            executionCost: true
        }
    });

    const costMap = new Map();
    costAggregations.forEach(agg => {
        costMap.set(`${agg.familyId}_${agg.strategy}`, agg._sum.executionCost || 0);
    });

    // Ritorniamo i dati arricchiti col costo
    const enrichedStats = families.flatMap(family => {
        return family.QueryStrategyStat.map(stat => {
            return {
                ...stat,
                executionCost: costMap.get(`${family.id}_${stat.strategy}`) || 0
            }
        });
    });

    // Restituiamo anche i KPI del job per la Dashboard Expected vs Actual
    const jobAggregates = await prisma.scrapingQuery.aggregate({
        where: { jobId, status: { in: ['BRANCH_CLOSED', 'LOW_YIELD', 'PAGE_LIMIT_REACHED'] } },
        _avg: {
            estimatedYield: true,
            actualYield: true,
            newResultCount: true,
            confidence: true
        }
    });

    return NextResponse.json({
      success: true,
      data: {
          strategyStats: enrichedStats,
          jobCalibration: {
              avgEstimatedYield: jobAggregates?._avg?.estimatedYield ?? null,
              avgActualYield: jobAggregates?._avg?.actualYield ?? null,
              avgNewResults: jobAggregates?._avg?.newResultCount ?? null,
              avgConfidence: jobAggregates?._avg?.confidence ?? null,
              estimatedVsActualError: (jobAggregates?._avg?.estimatedYield != null && jobAggregates?._avg?.actualYield != null) ? Math.abs(jobAggregates._avg.estimatedYield - jobAggregates._avg.actualYield) : null
          }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}




