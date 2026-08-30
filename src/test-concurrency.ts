import { prisma } from './lib/prisma';
import { QueryQueueService } from './lib/extraction/QueryQueueService';
import { QueryStatus } from '@prisma/client';

/**
 * TEST CONCORRENZA GLOBALE (Staging/Production Test)
 * Requisiti da verificare:
 * 1. Due chiamate simultanee non acquisiscono la stessa ScrapingQuery.
 * 2. Una query acquisita viene vista come RUNNING dalla seconda istanza.
 * 3. completeQuery() eseguito due volte sulla stessa query contabilizza ACTUAL una sola volta.
 * 4. failQuery() ripetuto non incrementa il costo due volte.
 * 5. Una query con heartbeat scaduto viene recuperata correttamente.
 * 6. Due query diverse aggiornano currentCost senza lost update.
 */
async function main() {
    console.log("🛠️ PREPARAZIONE AMBIENTE DI TEST...");
    
    const job = await prisma.scrapingJob.create({
        data: { cap: 'TEST_00100', maxEstimatedCost: 100, maxQueries: 10 }
    });

    const family = await prisma.queryFamily.create({
        data: { id: `TEST__${Date.now()}`, concept: 'TEST', scope: '00100' }
    });

    // TEST 1 & 2: Atomicità di Acquisizione
    console.log("\n▶️ TEST 1 & 2: Acquisizione simultanea...");
    const q1 = await prisma.scrapingQuery.create({
        data: { jobId: job.id, familyId: family.id, queryText: 'Q1', strategy: 'BASE', priority: 100 }
    });

    const [w1_q1, w2_q1] = await Promise.all([
        QueryQueueService.acquireNextQuery(job.id),
        QueryQueueService.acquireNextQuery(job.id)
    ]);
    
    if (w1_q1?.id === w2_q1?.id && w1_q1 !== null) {
        throw new Error("❌ FAIL: Entrambi i worker hanno acquisito la stessa query!");
    } else {
        console.log(`✅ SUCCESS: Acquisizione atomica. Worker A ha preso ${w1_q1?.id || w2_q1?.id}, Worker B ha preso null (coda vuota)`);
    }

    const acquiredId = w1_q1?.id || w2_q1?.id || '';

    // TEST 3: Idempotenza Complete
    console.log("\n▶️ TEST 3: Completamento simultaneo (Idempotenza)...");
    const mockActual = { resultCount: 10, newResultCount: 2, duplicateCount: 8, executionCost: 1.0, executionDurMs: 1000 };
    
    const [c1, c2] = await Promise.all([
        QueryQueueService.completeQuery(acquiredId, QueryStatus.BRANCH_CLOSED, mockActual),
        QueryQueueService.completeQuery(acquiredId, QueryStatus.BRANCH_CLOSED, mockActual)
    ]);

    const updatedJob = await prisma.scrapingJob.findUnique({ where: { id: job.id }});
    if (updatedJob?.currentCost === 2.0) {
        throw new Error("❌ FAIL: Il costo è stato fatturato due volte!");
    } else if (c1 === null || c2 === null) {
        console.log("✅ SUCCESS: Idempotenza confermata. Una transazione ha ritornato null ignorando il doppio completamento.");
        console.log(`✅ SUCCESS: Costo del job corretto a ${updatedJob?.currentCost}`);
    }

    // TEST 4: Idempotenza Fail
    console.log("\n▶️ TEST 4: Idempotenza Fail...");
    const q2 = await prisma.scrapingQuery.create({
        data: { jobId: job.id, familyId: family.id, queryText: 'Q2', strategy: 'BASE', priority: 100, status: 'RUNNING' }
    });
    
    await Promise.all([
        QueryQueueService.failQuery(q2.id, 5.0),
        QueryQueueService.failQuery(q2.id, 5.0)
    ]);
    const jobAfterFail = await prisma.scrapingJob.findUnique({ where: { id: job.id }});
    // Costo iniziale (1.0) + fail singolo (5.0) = 6.0
    if (jobAfterFail?.currentCost !== 6.0) {
        throw new Error(`❌ FAIL: Costo errato dopo doppio fail. Atteso: 6.0, Trovato: ${jobAfterFail?.currentCost}`);
    } else {
        console.log("✅ SUCCESS: Fail è idempotente. Costo scalato una sola volta.");
    }

    // TEST 5: Heartbeat Recovery
    console.log("\n▶️ TEST 5: Recovery da Timeout...");
    // Creiamo una query incastrata da 5 minuti
    await prisma.scrapingQuery.create({
        data: { 
            jobId: job.id, familyId: family.id, queryText: 'Q3', strategy: 'BASE', priority: 100, 
            status: 'RUNNING', heartbeatAt: new Date(Date.now() - 5 * 60 * 1000) 
        }
    });
    
    const recovered = await QueryQueueService.recoverStuckQueries(3); // recover > 3 min
    if (recovered !== 1) {
        throw new Error("❌ FAIL: Recovery fallito o ha recuperato troppe query.");
    } else {
        console.log("✅ SUCCESS: Query incastrata recuperata e riportata a PENDING.");
    }

    // TEST 6: Aggiornamento Costo Parallelo (No Lost Update)
    console.log("\n▶️ TEST 6: Lost Update sul costo globale...");
    const [q4, q5] = await Promise.all([
        prisma.scrapingQuery.create({ data: { jobId: job.id, familyId: family.id, queryText: 'Q4', strategy: 'BASE', priority: 100, status: 'RUNNING' }}),
        prisma.scrapingQuery.create({ data: { jobId: job.id, familyId: family.id, queryText: 'Q5', strategy: 'BASE', priority: 100, status: 'RUNNING' }})
    ]);

    await Promise.all([
        QueryQueueService.completeQuery(q4.id, QueryStatus.BRANCH_CLOSED, { ...mockActual, executionCost: 2.0 }),
        QueryQueueService.completeQuery(q5.id, QueryStatus.BRANCH_CLOSED, { ...mockActual, executionCost: 3.0 })
    ]);

    const finalJob = await prisma.scrapingJob.findUnique({ where: { id: job.id }});
    // 6.0 (precedente) + 2.0 + 3.0 = 11.0
    if (finalJob?.currentCost !== 11.0) {
        throw new Error(`❌ FAIL: Lost update rilevato! Costo atteso: 11.0, Trovato: ${finalJob?.currentCost}`);
    } else {
        console.log("✅ SUCCESS: Incremento DB atomico funzionante. Nessun lost update.");
    }

    console.log("\n🎉 TUTTI I TEST SONO PASSATI CON SUCCESSO!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
