import { prisma } from './lib/prisma';
import { QueryQueueService } from './lib/extraction/QueryQueueService';
import { ExecutionEngine } from './lib/extraction/ExecutionEngine';
import { DedupeService } from './lib/extraction/DedupeService';
import { GeoCellStrategy } from './lib/extraction/strategies/GeoCellStrategy';
import { GeoEngine } from './lib/extraction/geo/GeoEngine';
import { QueryStatus } from '@prisma/client';

async function main() {
    console.log("🌍 TEST END-TO-END GEO CELL (Quadtree Root)");

    // 1. Creazione Job e Family
    const job = await prisma.scrapingJob.create({
        data: { cap: '00100', maxEstimatedCost: 1.0, maxQueries: 5 }
    });
    const family = await prisma.queryFamily.create({
        data: { id: `GEO_${Date.now()}`, concept: 'Ristorante', scope: '00100' }
    });

    const strategy = new GeoCellStrategy();
    const bounds = {
        // Cella piccola (es. un quartiere denso di Roma come Trastevere)
        minLat: 41.885,
        maxLat: 41.895,
        minLng: 12.465,
        maxLng: 12.475
    };
    const rootCell = GeoEngine.createCell(
        bounds.minLat, bounds.maxLat, 
        bounds.minLng, bounds.maxLng, 
        0
    );

    const rootCandidate = {
        queryText: `Ristorante in cella ${rootCell.geoCellId}`,
        strategy: 'GEO_CELL',
        ...rootCell,
        estimatedCost: 0.032,
        gapMultiplier: 1.0
    };

    console.log(`\n▶️ ROOT CELL GENERATA:`);
    console.log(`- Cella ID: ${rootCandidate.geoCellId}`);
    console.log(`- Bounding Box: [${rootCandidate.cellMinLat}, ${rootCandidate.cellMinLng}] a [${rootCandidate.cellMaxLat}, ${rootCandidate.cellMaxLng}]`);
    console.log(`- Centro: ${rootCandidate.searchCenterLat}, ${rootCandidate.searchCenterLng}`);
    console.log(`- Raggio di ricerca: ${rootCandidate.searchRadius.toFixed(2)} metri`);

    // Inseriamo a DB
    await prisma.scrapingQuery.create({
        data: {
            queryText: rootCandidate.queryText,
            strategy: 'GEO_CELL',
            geoCellId: rootCandidate.geoCellId,
            geoDepth: rootCandidate.geoDepth,
            cellMinLat: rootCandidate.cellMinLat,
            cellMaxLat: rootCandidate.cellMaxLat,
            cellMinLng: rootCandidate.cellMinLng,
            cellMaxLng: rootCandidate.cellMaxLng,
            searchCenterLat: rootCandidate.searchCenterLat,
            searchCenterLng: rootCandidate.searchCenterLng,
            searchRadius: rootCandidate.searchRadius,
            priority: 100,
            status: 'PENDING',
            jobId: job.id,
            familyId: family.id
        }
    });

    console.log(`\n▶️ ACQUISIZIONE IN CORSO...`);
    const query = await QueryQueueService.acquireNextQuery(job.id);
    if (!query) throw new Error("Coda vuota");
    console.log(`✅ Acquisita Query ${query.id} (${query.status})`);

    // 3. Esecuzione REALE contro Google Nearby Search
    console.log(`\n▶️ ESECUZIONE GOOGLE (Nearby Search New)...`);
    const execResult = await ExecutionEngine.execute(query);
    
    if (!execResult.success) {
        console.error("❌ ERRORE GOOGLE:", execResult.error);
        return;
    }
    console.log(`✅ Google ha restituito ${execResult.rawContacts.length} contatti post-filtrati (limit: ${execResult.resultLimit}).`);
    console.log(`💰 Costo calcolato: ${execResult.executionCost}`);

    if (execResult.rawContacts.length > 0) {
        console.log(`Esempio record 1: ${execResult.rawContacts[0].rawName} - ${execResult.rawContacts[0].rawAddress}`);
    }

    // 4. Deduplica
    console.log(`\n▶️ DEDUPLICAZIONE...`);
    const { newContacts, duplicateCount } = await DedupeService.deduplicate(execResult.rawContacts);
    console.log(`✅ Risultati Nuovi: ${newContacts.length} | Duplicati: ${duplicateCount}`);

    // 5. Completamento
    console.log(`\n▶️ AGGIORNAMENTO KNOWLEDGE BASE E CHIUSURA...`);
    const limit = execResult.resultLimit ?? 60;
    // NOTA: siccome potremmo scartare risultati nel post-filter, Google potrebbe avercene dati 20
    // e noi ne abbiamo tenuti 18. Per decidere se siamo in OVERBOOKING (PAGE_LIMIT_REACHED), 
    // l'ideale sarebbe guardare se quelli scaricati originali erano >= limit.
    // Ma per semplicità ora assumiamo che se i filtrati sono tanti, splittiamo.
    // L'Execution Engine post-filtra, quindi rawContacts.length potrebbe essere < 20 anche se Google ne ha dati 20.
    // Tuttavia l'importante è che il limite ora sia dinamico e gestito dal post-filter.
    const endStatus = execResult.rawContacts.length >= limit ? QueryStatus.PAGE_LIMIT_REACHED : QueryStatus.BRANCH_CLOSED;
    
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
