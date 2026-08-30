import { prisma } from './lib/prisma';
import { QueryQueueService } from './lib/extraction/QueryQueueService';
import { QueryPlannerService } from './lib/extraction/QueryPlannerService';
import { ExecutionEngine } from './lib/extraction/ExecutionEngine';
import { DedupeService } from './lib/extraction/DedupeService';
import { QueryStatus } from '@prisma/client';
import { JobEventLogger } from './lib/extraction/JobEventLogger';

async function main() {
    console.log("🚀 AVVIO COLLAUDO REALE FASE 2");

    // 1. Creazione Job e Family reale
    const job = await prisma.scrapingJob.create({
        data: { cap: '00100', maxEstimatedCost: 0.1, maxQueries: 10, currentCost: 0, queriesExecuted: 0, status: 'RUNNING' }
    });
    const family = await prisma.queryFamily.create({
        data: { id: `E2E_${Date.now()}`, concept: 'Pizzeria', scope: '00100' }
    });
    console.log(`✅ Job Creato: ${job.id}`);

    // Inizializzazione: il frontend chiama /start che crea la prima query tramite il Planner
    await QueryPlannerService.selectNextAction(job.id, family.id);
    console.log(`✅ Planner ha inizializzato la prima mossa`);

    // Loop Orchestratore (simula la tab del browser aperta sulla Dashboard)
    let isRunning = true;
    let iteration = 0;

    while (isRunning && iteration < 15) {
        iteration++;
        console.log(`\n🔄 [Iterazione ${iteration}] Richiesta Acquisizione...`);
        
        // Simula la chiamata /process
        const recovered = await QueryQueueService.recoverStuckQueries(2);
        const query = await QueryQueueService.acquireNextQuery(job.id);
        
        if (!query) {
            console.log(`🛑 Nessuna query PENDING in coda. Il motore è IDLE.`);
            break;
        }

        console.log(`👉 Acquisita Query: [${query.strategy}] "${query.queryText}"`);
        const startMs = Date.now();

        // 3. Esecuzione
        const execResult = await ExecutionEngine.execute(query);
        
        if (!execResult.success) {
            console.error(`❌ ERRORE: ${execResult.error}`);
            await QueryQueueService.failQuery(query.id, execResult.executionCost);
            continue;
        }

        console.log(`✅ Esecuzione completata: trovati ${execResult.rawContacts.length} contatti. Costo: $${execResult.executionCost}`);

        // 4. Deduplica e Salvataggio
        const { newContacts, duplicateCount } = await DedupeService.deduplicate(execResult.rawContacts);
        
        for (const contact of newContacts) {
            await prisma.contact.create({
                data: {
                    source: contact.source,
                    sourceId: contact.sourceId,
                    rawName: contact.rawName,
                    rawAddress: contact.rawAddress,
                    normalizedName: contact.normalizedName,
                    normalizedStreet: contact.normalizedStreet,
                    normalizedNumber: contact.normalizedNumber,
                    dedupeKey: contact.dedupeKey,
                    name: contact.rawName, cap: '00100', sector: 'Pizzeria'
                }
            });
        }
        console.log(`✅ Salvati ${newContacts.length} nuovi contatti. Duplicati: ${duplicateCount}`);

        // 6. Completamento
        const limit = execResult.resultLimit ?? 60;
        const endStatus = execResult.rawContacts.length >= limit ? QueryStatus.PAGE_LIMIT_REACHED : QueryStatus.BRANCH_CLOSED;
        
        const actualData = {
            resultCount: execResult.rawContacts.length,
            newResultCount: newContacts.length,
            duplicateCount,
            executionCost: execResult.executionCost,
            executionDurMs: Date.now() - startMs
        };

        await QueryQueueService.completeQuery(query.id, endStatus, actualData);
        console.log(`✅ Query completata in DB con stato ${endStatus}`);

        // 7. Pianificazione Automatica
        console.log(`🧠 Invocazione Planner per decidere prossima mossa...`);
        await QueryPlannerService.selectNextAction(job.id, query.familyId);
    }

    console.log(`\n🎉 COLLAUDO TERMINATO. Analisi Statistiche in DB...`);

    // Lettura delle stats create e degli eventi
    const stats = await prisma.queryStrategyStat.findMany({ where: { familyId: family.id } });
    console.log(`\n📊 Statistiche DB:`);
    console.table(stats.map(s => ({ Strategy: s.strategy, Queries: s.totalQueries, Results: s.totalResults, New: s.totalNewResults, Yield: s.avgActualYield })));

    const events = await prisma.scrapingJobEvent.findMany({ where: { jobId: job.id }, orderBy: { timestamp: 'asc' } });
    console.log(`\n📝 Activity Feed (${events.length} eventi):`);
    events.forEach(e => console.log(`[${e.type}] ${e.message}`));
}

main().catch(console.error);

