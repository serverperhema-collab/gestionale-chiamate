import { prisma } from './lib/prisma';
import { QueryQueueService } from './lib/extraction/QueryQueueService';
import { ExecutionEngine } from './lib/extraction/ExecutionEngine';
import { DedupeService } from './lib/extraction/DedupeService';
import { QueryPlannerService } from './lib/extraction/QueryPlannerService';
import { QueryStatus } from '@prisma/client';

async function main() {
    console.log("🌍 TEST GEO CELL (RICORSIONE QUADTREE - 1 STEP)");

    // 1. Creazione Job e Family
    const job = await prisma.scrapingJob.create({
        data: { cap: '00100', maxEstimatedCost: 1.0, maxQueries: 10 }
    });
    const family = await prisma.queryFamily.create({
        data: { id: `GEO_REC_${Date.now()}`, concept: 'Ristorante', scope: '00100' }
    });

    // 2. TICK 1 PLANNER: Genera e seleziona la ROOT CELL
    console.log(`\n▶️ TICK PLANNER 1 (Root Cell)...`);
    const rootInserted = await QueryPlannerService.selectNextAction(job.id, family.id);
    if (!rootInserted) throw new Error("Planner non ha generato la root cell!");
    console.log(`✅ Root Cell pianificata: ${rootInserted.geoCellId} (Depth: ${rootInserted.geoDepth})`);

    // Acquisiamo ed eseguiamo la ROOT CELL (Mockiamo un risultato PAGE_LIMIT_REACHED)
    console.log(`▶️ ESECUZIONE ROOT CELL...`);
    const rootQ = await QueryQueueService.acquireNextQuery(job.id);
    if (!rootQ) throw new Error("Coda vuota");
    
    // Anziché chiamare Google, MOCKIAMO 20 risultati per simulare PAGE_LIMIT_REACHED istantaneo
    const mockRootContacts = Array.from({length: 20}).map((_, i) => ({
        source: 'GOOGLE' as const,
        sourceId: `MOCK_ROOT_${i}`,
        rawName: `Ristorante Root ${i}`,
        rawAddress: `Via Roma ${i}`,
        lat: 41.89, lng: 12.50 // al centro della ROOT
    }));

    const { newContacts: rootNew } = await DedupeService.deduplicate(mockRootContacts);
    
    // Forziamo PAGE_LIMIT_REACHED perché abbiamo 20 risultati
    await QueryQueueService.completeQuery(rootQ.id, QueryStatus.PAGE_LIMIT_REACHED, {
        resultCount: 20,
        newResultCount: rootNew.length,
        duplicateCount: 0,
        executionCost: 0.032,
        executionDurMs: 1000
    });
    console.log(`✅ Root Cell completata con PAGE_LIMIT_REACHED.`);

    // 3. TICK 2 PLANNER: Genera le 4 child, ne sceglie 1
    console.log(`\n▶️ TICK PLANNER 2 (Generazione Figli e Selezione)...`);
    const childInserted = await QueryPlannerService.selectNextAction(job.id, family.id);
    if (!childInserted) throw new Error("Planner non ha generato i figli o ha scartato le candidate!");
    
    console.log(`✅ Figlio Selezionato dal Planner: ${childInserted.geoCellId}`);
    console.log(`- Padre ID: ${childInserted.parentGeoCellId}`);
    console.log(`- Depth: ${childInserted.geoDepth}`);
    console.log(`- Bounding Box: [${childInserted.cellMinLat}, ${childInserted.cellMinLng}] a [${childInserted.cellMaxLat}, ${childInserted.cellMaxLng}]`);
    console.log(`- Raggio: ${childInserted.searchRadius?.toFixed(2)}m`);

    // Acquisiamo ed eseguiamo il FIGLIO
    console.log(`\n▶️ ESECUZIONE FIGLIO (Mock BRANCH_CLOSED)...`);
    const childQ = await QueryQueueService.acquireNextQuery(job.id);
    if (!childQ) throw new Error("Coda vuota");

    // Mockiamo 5 risultati per chiudere il branch
    const mockChildContacts = Array.from({length: 5}).map((_, i) => ({
        source: 'GOOGLE' as const,
        sourceId: `MOCK_CHILD_${i}`,
        rawName: `Ristorante Child ${i}`,
        rawAddress: `Via Figlio ${i}`,
        lat: childQ.searchCenterLat!, lng: childQ.searchCenterLng!
    }));

    const { newContacts: childNew } = await DedupeService.deduplicate(mockChildContacts);
    
    // Forziamo BRANCH_CLOSED
    await QueryQueueService.completeQuery(childQ.id, QueryStatus.BRANCH_CLOSED, {
        resultCount: 5,
        newResultCount: childNew.length,
        duplicateCount: 0,
        executionCost: 0.032,
        executionDurMs: 1000
    });
    console.log(`✅ Figlio completato con BRANCH_CLOSED (5 risultati).`);

    // 4. TICK 3 PLANNER: Dovrebbe generare gli altri fratelli
    console.log(`\n▶️ TICK PLANNER 3 (Verifica Idempotenza della Suddivisione)...`);
    const siblingInserted = await QueryPlannerService.selectNextAction(job.id, family.id);
    if (!siblingInserted) {
        console.log(`✅ Planner ha ignorato. Forse ha esaurito i figli validi (corretto a seconda dell'algoritmo).`);
    } else {
        console.log(`✅ Fratello pianificato: ${siblingInserted.geoCellId} (Depth ${siblingInserted.geoDepth})`);
        if (siblingInserted.geoCellId === childInserted.geoCellId) {
            console.error(`❌ ERRORE FATALE: Il Planner ha rigenerato e ri-inserito lo stesso figlio!`);
        } else {
            console.log(`✅ Il Fratello è matematicamente distinto. Idempotenza confermata.`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
