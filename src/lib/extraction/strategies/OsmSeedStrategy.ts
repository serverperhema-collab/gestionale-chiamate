import { ExtractionStrategy, StrategyType, PlannerContext, CandidateQuery } from './ExtractionStrategy';

export class OsmSeedStrategy implements ExtractionStrategy {
    readonly type: StrategyType = 'OSM_SEED';

    async generateCandidates(context: PlannerContext): Promise<CandidateQuery[]> {
        // TODO: Analizzare densità OSM per spingere l'esplorazione (gapMultiplier elevato).
        // Ritorna zero candidate per ora.
        return [];
    }
}
