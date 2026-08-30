import { PrismaClient, ScrapingQuery } from '@prisma/client';

export interface StrategyContext {
    strategy: string;
    geoDepth?: number;
    geoCellId?: string;
}

export class KnowledgeBaseService {
    
    /**
     * Recupera le statistiche specifiche per una strategia e un contesto geografico.
     * Ritorna i parametri necessari al Planner per calcolare l'Expected Value.
     */
    static async getStrategyStats(familyId: string, context: StrategyContext) {
        // Cerca lo storico per questa precisa configurazione
        // (Es. SYNONYM nel geoDepth 1)
        
        // workaround: convert undefined/null to -1/"GLOBAL" for Prisma
        const geoDepth = context.geoDepth ?? -1;
        const geoCellId = context.geoCellId ?? "GLOBAL";

        const stat = await prisma.queryStrategyStat.findUnique({
            where: {
                familyId_strategy_geoDepth_geoCellId: {
                    familyId,
                    strategy: context.strategy,
                    geoDepth,
                    geoCellId
                }
            }
        });

        if (!stat) {
            // Cold Start Defaults
            return {
                estimatedYield: 5.0,
                confidence: 0.25,
                explorationMultiplier: 1.5,
                isColdStart: true
            };
        }

        // Il confidence sale logaritmicamente con il numero di query eseguite, max 0.95
        // Ad es: 1 query -> 0.35, 10 query -> 0.75, 50 query -> 0.95
        const computedConfidence = Math.min(0.25 + (Math.log10(stat.totalQueries + 1) * 0.4), 0.95);

        // L'esplorazione diminuisce man mano che il confidence aumenta
        const explorationMultiplier = 1.0 + (0.5 * (1 - computedConfidence));

        return {
            estimatedYield: stat.avgNewResultsPerQuery,
            confidence: computedConfidence,
            explorationMultiplier,
            isColdStart: false
        };
    }

    /**
     * Esegue l'aggiornamento della KnowledgeBase all'interno di una transazione interattiva.
     */
    static async updateFamilyMetricsInTransaction(
        tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
        query: ScrapingQuery,
        actual: { resultCount: number; newResultCount: number; duplicateCount: number }
    ) {
        // 1. Aggiorna aggregati globali QueryFamily (opzionale, ma utile per overview)
        await tx.queryFamily.update({
            where: { id: query.familyId },
            data: {
                totalQueries: { increment: 1 },
                totalResults: { increment: actual.resultCount },
                totalNewResults: { increment: actual.newResultCount },
                totalDuplicates: { increment: actual.duplicateCount },
            }
        });

        // 2. Aggiorna le statistiche granularizzate (QueryStrategyStat)
        // workaround: convert undefined/null to -1/"GLOBAL" per Prisma UPSERT unique constraint
        const geoDepth = query.geoDepth ?? -1;
        const geoCellId = query.geoCellId ?? "GLOBAL";

        const stat = await tx.queryStrategyStat.upsert({
            where: {
                familyId_strategy_geoDepth_geoCellId: {
                    familyId: query.familyId,
                    strategy: query.strategy,
                    geoDepth,
                    geoCellId
                }
            },
            create: {
                familyId: query.familyId,
                strategy: query.strategy,
                geoDepth,
                geoCellId,
                totalQueries: 1,
                totalResults: actual.resultCount,
                totalNewResults: actual.newResultCount,
                totalDuplicates: actual.duplicateCount,
                avgActualYield: actual.resultCount > 0 ? (actual.newResultCount / actual.resultCount) : 0,
                avgNewResultsPerQuery: actual.newResultCount,
                estimatedVsActualError: query.estimatedYield ? Math.abs(query.estimatedYield - actual.newResultCount) : 0,
                confidence: 0.3 // Default start post first execution
            },
            update: {
                totalQueries: { increment: 1 },
                totalResults: { increment: actual.resultCount },
                totalNewResults: { increment: actual.newResultCount },
                totalDuplicates: { increment: actual.duplicateCount },
            }
        });

        // 3. Ricalcola le medie per la statistica aggiornata (smoothing progressivo)
        if (stat.totalQueries > 1) { // Se è > 1 l'abbiamo appena aggiornato sopra
            const avgYield = stat.totalResults > 0 ? (stat.totalNewResults / stat.totalResults) : 0;
            const avgNew = stat.totalQueries > 0 ? (stat.totalNewResults / stat.totalQueries) : 0;
            
            let error = 0;
            if (query.estimatedYield !== null && query.estimatedYield !== undefined) {
                error = Math.abs(query.estimatedYield - actual.newResultCount);
            }
            
            // Smoothed Error (EMA)
            const newAvgError = stat.estimatedVsActualError === 0 
                ? error 
                : (stat.estimatedVsActualError * 0.8) + (error * 0.2);

            // Confidence sale progressivamente fino a un massimo di 0.95
            const newConfidence = Math.min(0.25 + (Math.log10(stat.totalQueries + 1) * 0.4), 0.95);

            await tx.queryStrategyStat.update({
                where: { id: stat.id },
                data: {
                    avgActualYield: avgYield,
                    avgNewResultsPerQuery: avgNew,
                    estimatedVsActualError: newAvgError,
                    confidence: newConfidence
                }
            });
        }
    }
}
