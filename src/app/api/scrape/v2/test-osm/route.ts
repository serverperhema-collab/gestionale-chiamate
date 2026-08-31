import { NextRequest, NextResponse } from 'next/server';
import { OsmSeedStrategy } from '@/lib/extraction/strategies/OsmSeedStrategy';
import { GeoCellStrategy } from '@/lib/extraction/strategies/GeoCellStrategy';
import { prisma } from '@/lib/prisma';
import { ExecutionEngine } from '@/lib/extraction/ExecutionEngine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const cap = url.searchParams.get('cap') || '00172';
        const concept = url.searchParams.get('concept') || 'ristoranti';
        
        let job = await prisma.scrapingJob.findUnique({ where: { id: 'test_job_id' } });
        if (!job) {
            job = await prisma.scrapingJob.create({ data: { id: 'test_job_id', cap, maxEstimatedCost: 5, maxQueries: 200, currentCost: 0, queriesExecuted: 0, status: 'RUNNING' } });
        }
        
        const familyId = cap + '_' + concept;
        let f = await prisma.queryFamily.findUnique({ where: { id: familyId } });
        if (!f) {
            f = await prisma.queryFamily.create({ data: { id: familyId, concept, scope: cap } });
        }
        
        const context = { job: { ...job, _count: { queries: 0 } }, family: f } as any;

        await prisma.osmQueryCache.deleteMany({ where: { concept } });
        
        const osmStrategy = new OsmSeedStrategy();
        const osmCandidates = await osmStrategy.generateCandidates(context);
        
        if (osmCandidates.length === 0) return NextResponse.json({ error: 'Nessuna candidate generata' });
        const osmCandidate = osmCandidates[0];

        const start1 = Date.now();
        const exec1 = await ExecutionEngine.execute({
            id: 'test_query_1',
            jobId: job.id,
            familyId: f.id,
            strategy: 'OSM_SEED',
            queryText: osmCandidate.queryText,
            cellMinLat: osmCandidate.cellMinLat,
            cellMaxLat: osmCandidate.cellMaxLat,
            cellMinLng: osmCandidate.cellMinLng,
            cellMaxLng: osmCandidate.cellMaxLng
        } as any);
        const dur1 = Date.now() - start1;

        const start2 = Date.now();
        const exec2 = await ExecutionEngine.execute({
            id: 'test_query_2',
            jobId: job.id,
            familyId: f.id,
            strategy: 'OSM_SEED',
            queryText: osmCandidate.queryText,
            cellMinLat: osmCandidate.cellMinLat,
            cellMaxLat: osmCandidate.cellMaxLat,
            cellMinLng: osmCandidate.cellMinLng,
            cellMaxLng: osmCandidate.cellMaxLng
        } as any);
        const dur2 = Date.now() - start2;

        await prisma.scrapingQuery.deleteMany({ where: { jobId: job.id } });
        await prisma.scrapingQuery.create({
            data: {
                id: 'test_root_cell',
                jobId: job.id,
                familyId: f.id,
                queryText: 'root',
                strategy: 'GEO_CELL',
                status: 'PAGE_LIMIT_REACHED',
                geoDepth: 0,
                geoCellId: osmCandidate.geoCellId,
                cellMinLat: osmCandidate.cellMinLat,
                cellMaxLat: osmCandidate.cellMaxLat,
                cellMinLng: osmCandidate.cellMinLng,
                cellMaxLng: osmCandidate.cellMaxLng,
                searchCenterLat: osmCandidate.searchCenterLat,
                searchCenterLng: osmCandidate.searchCenterLng,
                searchRadius: osmCandidate.searchRadius,
                priority: 1,
                estimatedCost: 0,
                estimatedYield: 0
            }
        });

        const geoStrategy = new GeoCellStrategy();
        const geoCandidates = await geoStrategy.generateCandidates(context);

        await prisma.scrapingQuery.deleteMany({ where: { jobId: job.id } });

        const report = {
            cap,
            concept,
            osmStats: {
                firstRun: { durationMs: dur1, success: exec1.success, results: exec1.rawContacts.length, error: exec1.error || null, isCacheMiss: dur1 > 200 },
                secondRun: { durationMs: dur2, success: exec2.success, results: exec2.rawContacts.length, error: exec2.error || null, isCacheHit: dur2 < 50 }
            },
            geoCandidates: geoCandidates.map((c: any) => ({
                geoCellId: c.geoCellId,
                gapMultiplier: c.gapMultiplier,
                debugMath: c.debugMath
            }))
        };

        return NextResponse.json(report);
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
