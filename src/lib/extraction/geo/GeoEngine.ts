import crypto from 'crypto';

export interface GeoCell {
    geoCellId: string;
    geoDepth: number;
    cellMinLat: number;
    cellMaxLat: number;
    cellMinLng: number;
    cellMaxLng: number;
    searchCenterLat: number;
    searchCenterLng: number;
    searchRadius: number; // In metri
}

export class GeoEngine {
    /**
     * Calcola la distanza in metri tra due coordinate geografiche (Formula di Haversine)
     */
    static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3; // Raggio della terra in metri
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                  Math.cos(phi1) * Math.cos(phi2) *
                  Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Genera un ID deterministico per la cella
     */
    static generateCellId(minLat: number, maxLat: number, minLng: number, maxLng: number, depth: number): string {
        const raw = `${depth}_${minLat.toFixed(5)}_${maxLat.toFixed(5)}_${minLng.toFixed(5)}_${maxLng.toFixed(5)}`;
        return crypto.createHash('md5').update(raw).digest('hex').substring(0, 12);
    }

    /**
     * Crea una GeoCell partendo da un Bounding Box
     */
    static createCell(minLat: number, maxLat: number, minLng: number, maxLng: number, depth: number): GeoCell {
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        
        // Il raggio copre esattamente la cella (dal centro allo spigolo estremo)
        const radius = this.haversineDistance(centerLat, centerLng, maxLat, maxLng);

        return {
            geoCellId: this.generateCellId(minLat, maxLat, minLng, maxLng, depth),
            geoDepth: depth,
            cellMinLat: minLat,
            cellMaxLat: maxLat,
            cellMinLng: minLng,
            cellMaxLng: maxLng,
            searchCenterLat: centerLat,
            searchCenterLng: centerLng,
            searchRadius: radius
        };
    }

    /**
     * Suddivide matematicamente una cella in 4 sotto-celle (NW, NE, SW, SE)
     */
    static subdivideCell(cell: GeoCell): GeoCell[] {
        const midLat = cell.searchCenterLat;
        const midLng = cell.searchCenterLng;
        const newDepth = cell.geoDepth + 1;

        return [
            this.createCell(midLat, cell.cellMaxLat, cell.cellMinLng, midLng, newDepth), // NW (North-West)
            this.createCell(midLat, cell.cellMaxLat, midLng, cell.cellMaxLng, newDepth), // NE (North-East)
            this.createCell(cell.cellMinLat, midLat, cell.cellMinLng, midLng, newDepth), // SW (South-West)
            this.createCell(cell.cellMinLat, midLat, midLng, cell.cellMaxLng, newDepth), // SE (South-East)
        ];
    }
}
