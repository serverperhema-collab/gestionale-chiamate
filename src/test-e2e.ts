import { prisma } from './lib/prisma';
import { QueryQueueService } from './lib/extraction/QueryQueueService';
import { QueryPlannerService } from './lib/extraction/QueryPlannerService';
import { ExecutionEngine } from './lib/extraction/ExecutionEngine';
import { DedupeService } from './lib/extraction/DedupeService';
import { QueryStatus } from '@prisma/client';

async function main() {
    console.log("🚀 TEST END-TO-END SU GOOGLE PLACES API (NEW)");

    // 1. Creazione Job e Family reale
    const job = await prisma.scrapingJob.create({
        data: { cap: '00100', maxEstimatedCost: 0.1, maxQueries: 3 }
    });
    const family = await prisma.queryFamily.create({
        data: { id: `E2E_${Date.now()}`, concept: 'Pizzeria', scope: '00100' }
    });

    // 2. Creazione manuale della prima candidata in PENDING
    const q1 = await prisma.scrapingQuery.create({
        data: { 
            jobId: job.id, familyId: family.id, 
            queryText: 'Ristorante a Roma', 
            strategy: 'BASE', priority: 100, status: 'PENDING' 
        }
    });

    console.log(`\n▶️ ACQUISIZIONE IN CORSO...`);
    const query = await QueryQueueService.acquireNextQuery(job.id);
    if (!query) throw new Error("Coda vuota");
    console.log(`✅ Acquisita Query ${query.id} (${query.status}) - ${query.queryText}`);

    // 3. Esecuzione REALE contro Google
    console.log(`\n▶️ ESECUZIONE GOOGLE (Text Search New)...`);
    const execResult = await ExecutionEngine.execute(query);
    
    if (!execResult.success) {
        console.error("❌ ERRORE GOOGLE:", execResult.error);
        return;
    }
    console.log(`✅ Google ha restituito ${execResult.rawContacts.length} contatti grezzi.`);
    console.log(`💰 Costo calcolato da ExecutionEngine: ${execResult.executionCost}`);

    if (execResult.rawContacts.length > 0) {
        console.log(`Esempio record 1: ${execResult.rawContacts[0].rawName} - ${execResult.rawContacts[0].rawAddress}`);
    }

    // 4. Deduplica
    console.log(`\n▶️ DEDUPLICAZIONE...`);
    const { newContacts, duplicateCount } = await DedupeService.deduplicate(execResult.rawContacts);
    console.log(`✅ Risultati Nuovi: ${newContacts.length} | Duplicati: ${duplicateCount}`);

    // 5. Completamento
    console.log(`\n▶️ AGGIORNAMENTO KNOWLEDGE BASE E CHIUSURA...`);
    const endStatus = execResult.rawContacts.length >= 60 ? QueryStatus.PAGE_LIMIT_REACHED : QueryStatus.BRANCH_CLOSED;
    
    const completed = await QueryQueueService.completeQuery(query.id, endStatus, {
        resultCount: execResult.rawContacts.length,
        newResultCount: newContacts.length,
        duplicateCount: duplicateCount,
        executionCost: execResult.executionCost,
        executionDurMs: 1500
    });

    const finalJob = await prisma.scrapingJob.findUnique({ where: { id: job.id }});
    console.log(`✅ Query Chiusa con stato: ${completed?.status}`);
    console.log(`✅ Costo accumulato sul Job: ${finalJob?.currentCost}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
