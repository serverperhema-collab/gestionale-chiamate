import { ExtractionStrategy, StrategyType, PlannerContext, CandidateQuery } from './ExtractionStrategy';
import { BudgetControllerService } from '../BudgetControllerService';
import { GeoEngine, GeoCell } from '../geo/GeoEngine';
import { prisma } from '../../prisma';
import crypto from 'crypto';

export class GeoCellStrategy implements ExtractionStrategy {
    readonly type: StrategyType = 'GEO_CELL';
    private readonly MAX_GEO_DEPTH = 1; // TEST TEMPORANEO: disattiva ricorsione profonda

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
        
        const existingQueries = await prisma.scrapingQuery.findMany({
            where: { jobId: context.job.id, familyId: context.family.id, strategy: this.type }
        });

        const generatedIds = new Set(existingQueries.map(q => q.geoCellId).filter(Boolean));

        if (existingQueries.length === 0) {
            const bounds = this.getCapRootBounds(context.job.cap);
            const rootCell = GeoEngine.createCell(
                bounds.minLat, bounds.maxLat, 
                bounds.minLng, bounds.maxLng, 
                0
            );

            if (!generatedIds.has(rootCell.geoCellId)) {
                candidates.push(await this.mapCellToCandidate(rootCell, context, null));
            }
            return candidates;
        }

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
                    if (!generatedIds.has(child.geoCellId)) {
                        candidates.push(await this.mapCellToCandidate(child, context, parentCell.geoCellId));
                        generatedIds.add(child.geoCellId); 
                    }
                }
            }
        }

        return candidates;
    }

    private async mapCellToCandidate(cell: GeoCell, context: PlannerContext, parentId: string | null): Promise<CandidateQuery> {
        // Density Math (OSM vs Google)
        const bbox = `${cell.cellMinLat},${cell.cellMinLng},${cell.cellMaxLat},${cell.cellMaxLng}`;
        const queryHash = crypto.createHash('sha256').update(`${context.family.concept}_${bbox}_v1`).digest('hex');

        // OSM Density
        const cachedOsm = await prisma.osmQueryCache.findUnique({ where: { queryHash } });
        let osmMatches = cachedOsm ? cachedOsm.resultCount : 0;
        
        // Se non abbiamo ancora eseguito OSM su QUESTA sotto-cella, possiamo provare a dedurla dalla root cell? 
        // Per test: se non c'e cache esatta, osmMatches = 0 

        // Google Density (Gia trovati da altre strategie?)
        // Per semplificare in questo scope: usiamo sempre 0 per googleMatches inizialmente
        let googleMatches = 0;

        // Area in Km2 (Approssimativa usando bounding box)
        const latDiffKm = (cell.cellMaxLat - cell.cellMinLat) * 111.0;
        const lngDiffKm = (cell.cellMaxLng - cell.cellMinLng) * 111.0 * Math.cos(cell.searchCenterLat * Math.PI / 180);
        const cellAreaKm2 = Math.max(latDiffKm * lngDiffKm, 0.01);

        const osmDensity = osmMatches / cellAreaKm2;
        const googleDensity = googleMatches / cellAreaKm2;

        const epsilon = 0.1;
        const gapRatio = (osmDensity + epsilon) / (googleDensity + epsilon);
        
        // Log1p math
        const alpha = 0.5;
        let gapMultiplier = 1 + alpha * Math.log1p(gapRatio);
        
        // Clamp tra 0.5 e 3.0
        gapMultiplier = Math.min(Math.max(gapMultiplier, 0.5), 3.0);

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

            estimatedApiCost: BudgetControllerService.estimateQueryCost(this.type),
            estimatedOperationalCost: 0.2,
            gapMultiplier: gapMultiplier,
            debugMath: { osmDensity, googleDensity, gapRatio }
        };
    }
}



