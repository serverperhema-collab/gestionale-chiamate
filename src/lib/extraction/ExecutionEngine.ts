import { ScrapingQuery } from '@prisma/client';
import { GooglePlacesAdapter } from './adapters/GooglePlacesAdapter';
import { ExecutionEngineResult } from './adapters/ExecutionInterfaces';

export class ExecutionEngine {
    
    /**
     * Prende in carico una ScrapingQuery RUNNING e instrada l'esecuzione
     * al provider corretto (Google / OSM) senza prendere decisioni architetturali.
     */
    static async execute(query: ScrapingQuery): Promise<ExecutionEngineResult> {
        // In un ambiente reale la chiave API verrebbe presa dal DB, Env o Configurazione tenant
        const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

        if (!GOOGLE_API_KEY) {
            return { success: false, rawContacts: [], executionCost: 0, error: 'API Key missing' };
        }

        switch (query.strategy) {
            case 'BASE':
            case 'SYNONYM':
                // Per BASE e SYNONYM usiamo il Text Search (New) 
                // Il payload di testo è stato preparato dal Planner (es. "Idraulico in CAP 00172")
                return await GooglePlacesAdapter.textSearchDiscovery(query.queryText, GOOGLE_API_KEY);
            
            case 'GEO_CELL':
                // In futuro: GooglePlacesAdapter.nearbySearchDiscovery(...)
                return await GooglePlacesAdapter.nearbySearchDiscovery(query, GOOGLE_API_KEY);

            case 'OSM_SEED':
                // In futuro: OsmAdapter.overpassSearch(...)
                return { success: false, rawContacts: [], executionCost: 0, error: 'OSM_SEED non ancora supportato' };

            default:
                return { success: false, rawContacts: [], executionCost: 0, error: 'Strategia sconosciuta' };
        }
    }
}
