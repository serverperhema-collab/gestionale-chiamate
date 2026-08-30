import { ExtractionStrategy, StrategyType, PlannerContext, CandidateQuery } from './ExtractionStrategy';
import { BudgetControllerService } from '../BudgetControllerService';
import { GeoEngine, GeoCell } from '../geo/GeoEngine';
import { prisma } from '../../prisma';

export class GeoCellStrategy implements ExtractionStrategy {
    readonly type: StrategyType = 'GEO_CELL';
    private readonly MAX_GEO_DEPTH = 3;

    private getCapRootBounds(cap: string) {
        return {
            minLat: 41.79,
            maxLat: 42.00,
            minLng: 12.35,
            maxLng: 12.65
        };
    }

    async generateCandidates(context: PlannerContext): Promise<CandidateQuery[]> {
        const candidates: CandidateQuery[] = [];
        
        // Cerca tutte le query già generate da questa strategia per il Job/Family
        const existingQueries = await prisma.scrapingQuery.findMany({
            where: { jobId: context.job.id, familyId: context.family.id, strategy: this.type }
        });

        const generatedIds = new Set(existingQueries.map(q => q.geoCellId).filter(Boolean));

        if (existingQueries.length === 0) {
            // Cold start: genera solo la Root Cell (Depth 0)
            const bounds = this.getCapRootBounds(context.job.cap);
            const rootCell = GeoEngine.createCell(
                bounds.minLat, bounds.maxLat, 
                bounds.minLng, bounds.maxLng, 
                0
            );

            if (!generatedIds.has(rootCell.geoCellId)) {
                candidates.push(this.mapCellToCandidate(rootCell, context, null));
            }
            return candidates;
        }

        // Se esistono query, cerchiamo quelle esplose (PAGE_LIMIT_REACHED) per espanderle
        for (const q of existingQueries) {
            if (q.status === 'PAGE_LIMIT_REACHED' && q.geoDepth !== null && q.geoDepth < this.MAX_GEO_DEPTH) {
                
                const parentCell: GeoCell = {
                    geoCellId: q.geoCellId!,
                    geoDepth: q.geoDepth,
                    cellMinLat: q.cellMinLat!,
                    cellMaxLat: q.cellMaxLat!,
                    cellMinLng: q.cellMinLng!,
                    cellMaxLng: q.cellMaxLng!,
                    searchCenterLat: q.searchCenterLat!,
                    searchCenterLng: q.searchCenterLng!,
                    searchRadius: q.searchRadius!
                };

                const children = GeoEngine.subdivideCell(parentCell);
                
                for (const child of children) {
                    // Generiamo come candidata solo se non esiste GIA' nel DB per questo job/family
                    // (ovvero se non l'abbiamo ancora inserita in coda)
                    if (!generatedIds.has(child.geoCellId)) {
                        candidates.push(this.mapCellToCandidate(child, context, parentCell.geoCellId));
                        generatedIds.add(child.geoCellId); // Evita duplicati nella stessa iterazione
                    }
                }
            }
        }

        return candidates;
    }

    private mapCellToCandidate(cell: GeoCell, context: PlannerContext, parentId: string | null): CandidateQuery {
        return {
            queryText: `${context.family.concept} in cella ${cell.geoCellId}`,
            strategy: this.type,
            
            geoCellId: cell.geoCellId,
            parentGeoCellId: parentId || undefined,
            geoDepth: cell.geoDepth,
            cellMinLat: cell.cellMinLat,
            cellMaxLat: cell.cellMaxLat,
            cellMinLng: cell.cellMinLng,
            cellMaxLng: cell.cellMaxLng,
            searchCenterLat: cell.searchCenterLat,
            searchCenterLng: cell.searchCenterLng,
            searchRadius: cell.searchRadius,

            estimatedCost: BudgetControllerService.estimateQueryCost(this.type),
            gapMultiplier: 1.0
        };
    }
}
