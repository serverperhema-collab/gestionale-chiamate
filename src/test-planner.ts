import { prisma } from './lib/prisma';
import { QueryPlannerService } from './lib/extraction/QueryPlannerService';
import { QueryQueueService } from './lib/extraction/QueryQueueService';
import { KnowledgeBaseService } from './lib/extraction/KnowledgeBaseService';
import { QueryStatus } from '@prisma/client';

async function main() {
    console.log("🧠 TEST DETERMINISTICO DEL QUERY PLANNER - CALIBRAZIONE");
    
    // 1. Setup
    const job = await prisma.scrapingJob.create({
        data: { cap: 'TEST_CALIB', maxEstimatedCost: 100, maxQueries: 50 }
    });
    const family = await prisma.queryFamily.create({
        data: { id: `CALIB__${Date.now()}`, concept: 'Calibrazione', scope: '00000' }
    });

    console.log("\n▶️ TEST CALIBRAZIONE: Convergenza Yield = 50");
    // Eseguiamo 10 query consecutive con esito = 50 nuovi risultati per la BASE strategy
    let lastQuery = null;
    for(let i = 1; i <= 10; i++) {
        const q = await prisma.scrapingQuery.create({
            data: { jobId: job.id, familyId: family.id, queryText: `Q_BASE_${i}`, strategy: 'BASE', priority: 1, status: 'RUNNING' }
        });
        await QueryQueueService.completeQuery(q.id, QueryStatus.BRANCH_CLOSED, {
            resultCount: 60, newResultCount: 50, duplicateCount: 10, executionCost: 0.032, executionDurMs: 100
        });
        lastQuery = q;
    }
    
    let stats = await KnowledgeBaseService.getStrategyStats(family.id, { strategy: 'BASE' });
    console.log(`Dopo 10 esecuzioni fisse a 50 -> Estimated Yield: ${stats.estimatedYield.toFixed(2)} (Atteso ~50)`);
    console.log(`Confidence: ${stats.confidence.toFixed(2)} (Atteso > 0.6)`);
    
    if (Math.abs(stats.estimatedYield - 50) > 2) throw new Error("❌ FAIL: Yield non convergente a 50");

    console.log("\n▶️ TEST CALIBRAZIONE: Convergenza Yield = 0 (SYNONYM)");
    for(let i = 1; i <= 10; i++) {
        const q = await prisma.scrapingQuery.create({
            data: { jobId: job.id, familyId: family.id, queryText: `Q_SYN_${i}`, strategy: 'SYNONYM', priority: 1, status: 'RUNNING' }
        });
        await QueryQueueService.completeQuery(q.id, QueryStatus.BRANCH_CLOSED, {
            resultCount: 60, newResultCount: 0, duplicateCount: 60, executionCost: 0.032, executionDurMs: 100
        });
    }
    stats = await KnowledgeBaseService.getStrategyStats(family.id, { strategy: 'SYNONYM' });
    console.log(`Dopo 10 esecuzioni fisse a 0 -> Estimated Yield: ${stats.estimatedYield.toFixed(2)} (Atteso ~0)`);
    if (Math.abs(stats.estimatedYield - 0) > 1) throw new Error("❌ FAIL: Yield non convergente a 0");

    console.log("\n▶️ TEST CALIBRAZIONE: Oscillazione (GEO_CELL)");
    // Eseguiamo 10 query oscillanti: 10, 50, 10, 50
    for(let i = 1; i <= 10; i++) {
        const results = (i % 2 === 0) ? 50 : 10;
        const q = await prisma.scrapingQuery.create({
            data: { jobId: job.id, familyId: family.id, queryText: `Q_GEO_${i}`, strategy: 'GEO_CELL', priority: 1, status: 'RUNNING' }
        });
        await QueryQueueService.completeQuery(q.id, QueryStatus.BRANCH_CLOSED, {
            resultCount: 60, newResultCount: results, duplicateCount: 60-results, executionCost: 0.032, executionDurMs: 100
        });
    }
    stats = await KnowledgeBaseService.getStrategyStats(family.id, { strategy: 'GEO_CELL' });
    console.log(`Dopo 10 esecuzioni oscillanti (10/50) -> Estimated Yield: ${stats.estimatedYield.toFixed(2)} (Atteso ~30)`);
    if (Math.abs(stats.estimatedYield - 30) > 5) throw new Error("❌ FAIL: Smoothing errato, media attesa intorno a 30");

    const rawStat = await prisma.queryStrategyStat.findFirst({ where: { familyId: family.id, strategy: 'GEO_CELL'} });
    console.log(`Errore Smussato (EMA): ${rawStat?.estimatedVsActualError.toFixed(2)}`);

    console.log("\n🎉 TUTTI I TEST DI CALIBRAZIONE MATEMATICA SONO SUPERATI!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
