import { ScrapingJob, QueryFamily } from '@prisma/client';

export type StrategyType = 'BASE' | 'SYNONYM' | 'GEO_CELL' | 'OSM_SEED';

export interface PlannerContext {
    job: ScrapingJob;
    family: QueryFamily;
    // Potremo aggiungere geoBounds, configurazioni, ecc. in futuro
}

/**
 * Modello in-memory (DTO) generato dalle Strategy, prima di essere valutato dal Planner
 * e trasformato in un record reale di ScrapingQuery sul Database.
 */
export interface CandidateQuery {
    queryText: string;
    strategy: StrategyType;
    
    // Geo Engine Metadata (se presenti)
    geoCellId?: string;
    parentGeoCellId?: string;
    geoDepth?: number;
    cellMinLat?: number;
    cellMaxLat?: number;
    cellMinLng?: number;
    cellMaxLng?: number;
    searchCenterLat?: number;
    searchCenterLng?: number;
    searchRadius?: number;

    // Fattori base di costo/gap (forniti dalla Strategy o calcolati dal Planner)
    estimatedApiCost: number;
    estimatedOperationalCost: number;
    gapMultiplier: number;
    debugMath?: any;
}

/**
 * Contratto comune per i generatori di query.
 */
export interface ExtractionStrategy {
    readonly type: StrategyType;

    /**
     * Genera le "Candidate Actions" in base al contesto, senza inserirle in coda.
     */
    generateCandidates(context: PlannerContext): Promise<CandidateQuery[]>;
}


