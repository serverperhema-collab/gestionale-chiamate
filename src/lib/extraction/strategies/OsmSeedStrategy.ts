import { ExtractionStrategy, StrategyType, PlannerContext, CandidateQuery } from './ExtractionStrategy';
import { prisma } from '../../prisma';
import { GeoEngine } from '../geo/GeoEngine';

export class OsmSeedStrategy implements ExtractionStrategy {
    readonly type: StrategyType = 'OSM_SEED';

    private getCapRootBounds(cap: string) {
        return {
            minLat: 41.79,
            maxLat: 42.00,
            minLng: 12.35,
            maxLng: 12.65
        };
    }

    async generateCandidates(context: PlannerContext): Promise<CandidateQuery[]> {
        // Cerca se abbiamo gi pianificato/eseguito OSM_SEED per questo Job
        const existingQueries = await prisma.scrapingQuery.count({
            where: { jobId: context.job.id, familyId: context.family.id, strategy: this.type }
        });

        // Eseguiamo OSM solo all'inizio assoluto (Depth 0)
        if (existingQueries > 0) {
            return [];
        }

        const bounds = this.getCapRootBounds(context.job.cap);
        const rootCell = GeoEngine.createCell(bounds.minLat, bounds.maxLat, bounds.minLng, bounds.maxLng, 0);

        return [{
            queryText: `[OSM] Mappa di Calore ${context.family.concept} (CAP ${context.job.cap})`,
            strategy: this.type,
            
            geoCellId: rootCell.geoCellId,
            geoDepth: rootCell.geoDepth,
            cellMinLat: rootCell.cellMinLat,
            cellMaxLat: rootCell.cellMaxLat,
            cellMinLng: rootCell.cellMinLng,
            cellMaxLng: rootCell.cellMaxLng,
            searchCenterLat: rootCell.searchCenterLat,
            searchCenterLng: rootCell.searchCenterLng,
            searchRadius: rootCell.searchRadius,

            // Costo operativo nominale per non avere priority infinita
            estimatedApiCost: 0.00,
            estimatedOperationalCost: 0.5,
            gapMultiplier: 5.0 // Fortissimo boost esplorativo iniziale
        }];
    }
}

