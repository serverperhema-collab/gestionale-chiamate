import { JobEventLogger } from './JobEventLogger';
import { prisma } from '@/lib/prisma';
import { QueryStatus } from '@prisma/client';
import { KnowledgeBaseService } from './KnowledgeBaseService';
import { BudgetControllerService } from './BudgetControllerService';

export class QueryQueueService {
    
    /**
     * Recovery: resetta le query bloccate.
     * Usa heartbeatAt al posto di startedAt per tollerare query lente ma attive.
     */
    static async recoverStuckQueries(timeoutMinutes = 2) {
        const threshold = new Date(Date.now() - timeoutMinutes * 60 * 1000);
        
        const result = await prisma.scrapingQuery.updateMany({
            where: {
                status: 'RUNNING',
                heartbeatAt: { lt: threshold }
            },
            data: {
                status: 'PENDING',
                lockedAt: null,
                heartbeatAt: null
            }
        });
        
        return result.count;
    }

    /**
     * Aggiorna l'heartbeat di una query in esecuzione (da chiamare ogni ~30s dal worker).
     */
    static async heartbeat(queryId: string) {
        await prisma.scrapingQuery.updateMany({
            where: { id: queryId, status: 'RUNNING' },
            data: { heartbeatAt: new Date() }
        });
    }

    /**
     * Acquisizione Atomica con Retry Interno per Race Conditions.
     */
    static async acquireNextQuery(jobId: string, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const candidate = await prisma.scrapingQuery.findFirst({
                where: { jobId, status: 'PENDING' },
                orderBy: { priority: 'desc' },
            });
            
            if (!candidate) return null; // Coda PENDING veramente vuota
            
            const now = new Date();
            const updateResult = await prisma.scrapingQuery.updateMany({
                where: { id: candidate.id, status: 'PENDING' },
                data: { 
                    status: 'RUNNING', 
                    lockedAt: now,
                    heartbeatAt: now 
                }
            });
            
            if (updateResult.count > 0) {
                return candidate; // Acquisita con successo!
            }
            // Race condition: qualcuno l'ha presa prima di noi. Il loop ritenta.
        }
        return null; // Falliti tutti i tentativi
    }

    /**
     * Completamento Idempotente Atomico.
     */
    static async completeQuery(
        queryId: string,
        newStatus: QueryStatus, // PAGE_LIMIT_REACHED, LOW_YIELD, BRANCH_CLOSED
        actual: {
            resultCount: number;
            newResultCount: number;
            duplicateCount: number;
            executionCost: number;
            executionDurMs: number;
        }
    ) {
        const actualYield = actual.resultCount > 0 ? (actual.newResultCount / actual.resultCount) : 0;

        return await prisma.$transaction(async (tx) => {
            // 1. Verifica Idempotenza e Aggiorna Query Atomicamente
            const updateResult = await tx.scrapingQuery.updateMany({
                where: { id: queryId, status: 'RUNNING' },
                data: {
                    status: newStatus,
                    resultCount: actual.resultCount,
                    newResultCount: actual.newResultCount,
                    duplicateCount: actual.duplicateCount,
                    actualYield: actualYield,
                    executionCost: actual.executionCost,
                    executionDurMs: actual.executionDurMs
                }
            });

            if (updateResult.count === 0) {
                return null; // Già processata o non in RUNNING
            }

            const query = await tx.scrapingQuery.findUnique({ where: { id: queryId } });
            if (!query) return null;

            await tx.scrapingJob.update({
                where: { id: query.jobId },
                data: {
                    currentCost: { increment: actual.executionCost },
                    queriesExecuted: { increment: 1 }
                }
            });

            // Log event
            await JobEventLogger.log(query.jobId, 'EXECUTION', `Query ${query.strategy} completata con stato ${newStatus}: trovati ${actual.resultCount} risultati (${actual.newResultCount} nuovi). Costo: $${actual.executionCost.toFixed(3)}`, undefined, tx);

            // 3. Delega logiche di business isolate
            await KnowledgeBaseService.updateFamilyMetricsInTransaction(tx, query, actual);
            await BudgetControllerService.addCostInTransaction(tx, query.jobId, actual.executionCost);

            return query;
        });
    }

    /**
     * Fallimento Idempotente Atomico.
     */
    static async failQuery(queryId: string, costIncurred: number = 0) {
        return await prisma.$transaction(async (tx) => {
            const updateResult = await tx.scrapingQuery.updateMany({
                where: { id: queryId, status: 'RUNNING' },
                data: { status: 'FAILED', executionCost: costIncurred }
            });

            if (updateResult.count === 0) return null;

            const query = await tx.scrapingQuery.findUnique({ where: { id: queryId } });
            if (!query) return null;

            // Log event
            await JobEventLogger.log(query.jobId, 'ERROR', `Query ${query.strategy} fallita. Costo: $${costIncurred.toFixed(3)}`, undefined, tx);

            await BudgetControllerService.addCostInTransaction(tx, query.jobId, costIncurred);

            return query;
        });
    }
}


