import { JobEventLogger } from './JobEventLogger';
import { prisma } from '@/lib/prisma';
import { PlannerContext, ExtractionStrategy, CandidateQuery } from './strategies/ExtractionStrategy';
import { BaseStrategy } from './strategies/BaseStrategy';
import { SynonymStrategy } from './strategies/SynonymStrategy';
import { GeoCellStrategy } from './strategies/GeoCellStrategy';
import { OsmSeedStrategy } from './strategies/OsmSeedStrategy';
import { KnowledgeBaseService } from './KnowledgeBaseService';

export class QueryPlannerService {
    private static strategies: ExtractionStrategy[] = [
        new BaseStrategy(),
        new SynonymStrategy(),
        new GeoCellStrategy(),
        new OsmSeedStrategy()
    ];

    /**
     * Valuta tutte le strategie possibili per un determinato ScrapingJob e
     * accoda solo la query col miglior rendimento atteso.
     */
    static async selectNextAction(jobId: string, familyId: string) {
        // 1. Carica Job e Family
        const job = await prisma.scrapingJob.findUnique({ 
            where: { id: jobId },
            include: { _count: { select: { queries: true } } }
        });
        if (!job) throw new Error("Job non trovato");

        // Controllo limiti operativi (Budget e Query Max)
        if (job.currentCost >= job.maxEstimatedCost) {
            console.log(`[PLANNER] Job ${jobId} ha raggiunto il limite di costo (${job.currentCost} >= ${job.maxEstimatedCost}). Stop.`);
            return null;
        }
        if (job.maxQueries > 0 && job._count.queries >= job.maxQueries) {
            console.log(`[PLANNER] Job ${jobId} ha raggiunto il limite di queries (${job._count.queries} >= ${job.maxQueries}). Stop.`);
            return null;
        }

        const family = await prisma.queryFamily.findUnique({ where: { id: familyId } });
        if (!family) throw new Error("Family non trovata");

        const context: PlannerContext = { job, family };

        // 2. Chiede a ciascuna strategia le CandidateQuery possibili
        let candidates: CandidateQuery[] = [];
        for (const strategy of this.strategies) {
            const batch = await strategy.generateCandidates(context);
            candidates = candidates.concat(batch);
        }

        if (candidates.length === 0) return null;

        // 3. Calcola i punteggi (Expected Value)
        let bestCandidate = null;
        let highestPriority = -1;
        let bestSnapshot = null;

        for (const candidate of candidates) {
            // A. Evita di valutare query testuali già pianificate/eseguite per questo job
            const exists = await prisma.scrapingQuery.count({
                where: { jobId, queryText: candidate.queryText }
            });
            if (exists > 0) continue;

            // B. Recupera le statistiche di questa specifica configurazione
            const stats = await KnowledgeBaseService.getStrategyStats(family.id, {
                strategy: candidate.strategy,
                geoDepth: candidate.geoDepth,
                geoCellId: candidate.geoCellId
            });
            
            const effectiveCost = candidate.estimatedApiCost + (candidate.estimatedOperationalCost * 0.05);
            const apiCostToSave = candidate.estimatedApiCost;

            // C. Calcolo Priority finale
            const priority = (stats.estimatedYield * stats.confidence * candidate.gapMultiplier * stats.explorationMultiplier) / effectiveCost;

            if (priority > highestPriority) {
                highestPriority = priority;
                bestCandidate = candidate;
                
                const reason = `Strategy: ${candidate.strategy} (Cold:${stats.isColdStart}). Yield:${stats.estimatedYield.toFixed(2)} * Conf:${stats.confidence.toFixed(2)} * Gap:${candidate.gapMultiplier.toFixed(2)} * Expl:${stats.explorationMultiplier.toFixed(2)} / EffCost:${effectiveCost.toFixed(3)} = Prio:${priority.toFixed(2)}`;
                
                bestSnapshot = {
                    estimatedYield: stats.estimatedYield,
                    confidence: stats.confidence,
                    gapMultiplier: candidate.gapMultiplier,
                    explorationMult: stats.explorationMultiplier,
                    estimatedCost: apiCostToSave,
                    priority,
                    plannerReason: reason
                };
            }
        }

        if (!bestCandidate || !bestSnapshot) return null;

        // 4. Salva in coda (QueryQueue) solo la vincitrice
        const nextQuery = await prisma.scrapingQuery.create({
            data: {
                jobId,
                familyId: family.id,
                queryText: bestCandidate.queryText,
                strategy: bestCandidate.strategy,
                priority: bestSnapshot.priority,
                estimatedYield: bestSnapshot.estimatedYield,
                status: 'PENDING',
                
                // Geo Metadata
                geoCellId: bestCandidate.geoCellId,
                parentGeoCellId: bestCandidate.parentGeoCellId,
                geoDepth: bestCandidate.geoDepth,
                cellMinLat: bestCandidate.cellMinLat,
                cellMaxLat: bestCandidate.cellMaxLat,
                cellMinLng: bestCandidate.cellMinLng,
                cellMaxLng: bestCandidate.cellMaxLng,
                searchCenterLat: bestCandidate.searchCenterLat,
                searchCenterLng: bestCandidate.searchCenterLng,
                searchRadius: bestCandidate.searchRadius,

                // Expected Snapshot immutabile
                estimatedCost: bestSnapshot.estimatedCost,
                plannerReason: bestSnapshot.plannerReason
            }
        });

        // Registra evento
        await JobEventLogger.log(jobId, 'PLANNER', `Il Planner ha selezionato la strategia ${bestCandidate.strategy} (${bestCandidate.queryText})`, bestSnapshot);

        return nextQuery;
    }
}




