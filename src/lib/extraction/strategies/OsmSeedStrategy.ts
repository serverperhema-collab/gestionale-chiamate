import { ExtractionStrategy, StrategyType, PlannerContext, CandidateQuery } from './ExtractionStrategy';
import { prisma } from '../../prisma';
import { GeoEngine } from '../geo/GeoEngine';
import { CapResolver } from '../geo/CapResolver';

export class OsmSeedStrategy implements ExtractionStrategy {
    readonly type: StrategyType = 'OSM_SEED';

    async generateCandidates(context: PlannerContext): Promise<CandidateQuery[]> {
        const existingQueries = await prisma.scrapingQuery.count({
            where: { jobId: context.job.id, familyId: context.family.id, strategy: this.type }
        });

        if (existingQueries > 0) {
            return [];
        }

        const bounds = await CapResolver.getBounds(context.job.cap);
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

            estimatedApiCost: 0.00,
            estimatedOperationalCost: 0.5,
            gapMultiplier: 5.0 
        }];
    }
}
