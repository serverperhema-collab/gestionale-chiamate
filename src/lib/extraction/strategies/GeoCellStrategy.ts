import { ExtractionStrategy, StrategyType, PlannerContext, CandidateQuery } from './ExtractionStrategy';
import { BudgetControllerService } from '../BudgetControllerService';
import { GeoEngine, GeoCell } from '../geo/GeoEngine';
import { prisma } from '../../prisma';
import crypto from 'crypto';

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
        
        const existingQueries = await prisma.scrapingQuery.findMany({
            where: { jobId: context.job.id, familyId: context.family.id, strategy: this.type }
        });

        const generatedIds = new Set(existingQueries.map(q => q.geoCellId).filter(Boolean));

        const bounds = this.getCapRootBounds(context.job.cap);
        const rootBbox = `${bounds.minLat},${bounds.minLng},${bounds.maxLat},${bounds.maxLng}`;
        const rootQueryHash = crypto.createHash('sha256').update(`${context.family.concept}_${rootBbox}_v1`).digest('hex');
        const rootCache = await prisma.osmQueryCache.findUnique({ where: { queryHash: rootQueryHash } });
        const allOsmPois = (rootCache?.resultData as any[]) || [];

        if (existingQueries.length === 0) {
            const rootCell = GeoEngine.createCell(
                bounds.minLat, bounds.maxLat, 
                bounds.minLng, bounds.maxLng, 
                0
            );

            if (!generatedIds.has(rootCell.geoCellId)) {
                candidates.push(await this.mapCellToCandidate(rootCell, context, null, allOsmPois));
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
                        candidates.push(await this.mapCellToCandidate(child, context, parentCell.geoCellId, allOsmPois));
                        generatedIds.add(child.geoCellId); 
                    }
                }
            }
        }

        return candidates;
    }

    private async mapCellToCandidate(cell: GeoCell, context: PlannerContext, parentId: string | null, allOsmPois: any[]): Promise<CandidateQuery> {
        // Conta quanti POI OSM cadono ESATTAMENTE dentro questa specifica sotto-cella (Bounding Box check)
        const osmMatches = allOsmPois.filter(poi => 
            poi.lat >= cell.cellMinLat && poi.lat <= cell.cellMaxLat &&
            poi.lng >= cell.cellMinLng && poi.lng <= cell.cellMaxLng
        ).length;

        // Google Density (Gia trovati da altre strategie?)
        let googleMatches = 0;

        // Area in Km2
        const latDiffKm = (cell.cellMaxLat - cell.cellMinLat) * 111.0;
        const lngDiffKm = (cell.cellMaxLng - cell.cellMinLng) * 111.0 * Math.cos(cell.searchCenterLat * Math.PI / 180);
        const cellAreaKm2 = Math.max(latDiffKm * lngDiffKm, 0.01);

        const osmDensity = osmMatches / cellAreaKm2;
        const googleDensity = googleMatches / cellAreaKm2;

        const epsilon = 0.1;
        const gapRatio = (osmDensity + epsilon) / (googleDensity + epsilon);
        
        const alpha = 0.5;
        let gapMultiplier = 1 + alpha * Math.log1p(gapRatio);
        
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
            debugMath: { osmMatches, cellAreaKm2, osmDensity, googleDensity, gapRatio }
        };
    }
}

