import { QueryPlannerService } from '@/lib/extraction/QueryPlannerService';
import { NextRequest, NextResponse } from 'next/server';
import { QueryQueueService } from '@/lib/extraction/QueryQueueService';
import { ExecutionEngine } from '@/lib/extraction/ExecutionEngine';
import { DedupeService } from '@/lib/extraction/DedupeService';
import { QueryStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { jobId } = body;

        if (!jobId) {
            return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
        }

        // 1. Recovery delle query "incastrate"
        const recovered = await QueryQueueService.recoverStuckQueries(2);

        // 2. Acquisizione Atomica
        const query = await QueryQueueService.acquireNextQuery(jobId);
        
        if (!query) {
            return NextResponse.json({ status: 'IDLE', message: 'Nessuna query in PENDING', recovered });
        }

        const startMs = Date.now();

        // 3. Esecuzione (Google / OSM)
        console.log(`[Worker] Eseguo query ${query.id} [${query.strategy}]: "${query.queryText}"`);
        const job = await prisma.scrapingJob.findUnique({ where: { id: jobId } });
        const family = await prisma.queryFamily.findUnique({ where: { id: query.familyId } });
        const execResult = await ExecutionEngine.execute(query);

        if (!execResult.success) {
            console.error(`[Worker] Errore esecuzione: ${execResult.error}`);
            await QueryQueueService.failQuery(query.id, execResult.executionCost);
            return NextResponse.json({ status: 'FAILED', queryId: query.id, error: execResult.error });
        }

        // 4. Deduplica e Normalizzazione
        const { newContacts, duplicateCount } = await DedupeService.deduplicate(execResult.rawContacts);

        // 5. Salvataggio su DB dei contatti validi
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
                    // Dati minimi legacy per compatibilità UI:
                    name: contact.rawName,
                    address: contact.rawAddress,
                    cap: job?.cap || '00000',
                    sector: family?.concept || 'Generico'
                }
            });
        }

        // 6. Completamento Atomico (Actual -> Knowledge Base -> Budget)
        const executionDurMs = Date.now() - startMs;
        const resultCount = execResult.rawContacts.length;
        
        // Se Text Search ha restituito < limit risultati, la ricerca è esaustiva per quel branch
        // Google dice massimo 60        
        const limit = execResult.resultLimit ?? 60;
        const endStatus = execResult.rawContacts.length >= limit ? QueryStatus.PAGE_LIMIT_REACHED : QueryStatus.BRANCH_CLOSED;

        const actualData = {
            resultCount,
            newResultCount: newContacts.length,
            duplicateCount,
            executionCost: execResult.executionCost,
            executionDurMs
        };

        const completedQuery = await QueryQueueService.completeQuery(query.id, endStatus, actualData);

        // 7. Pianificazione Automatica Prossima Mossa
        await QueryPlannerService.selectNextAction(jobId, query.familyId);

        return NextResponse.json({
            status: 'COMPLETED',
            queryId: query.id,
            strategy: query.strategy,
            actual: actualData,
            dbStatus: endStatus
        });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


