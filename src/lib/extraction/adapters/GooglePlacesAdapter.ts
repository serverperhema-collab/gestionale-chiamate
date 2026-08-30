import { ExecutionEngineResult, RawDiscoveryContact } from './ExecutionInterfaces';

export class GooglePlacesAdapter {
    /**
     * Esegue una chiamata a Google Places API (New) - Text Search
     * Utilizzando i campi minimi necessari per il nostro contratto Discovery.
     */
    static async textSearchDiscovery(queryText: string, apiKey: string): Promise<ExecutionEngineResult> {
        const fieldMask = 'places.id,places.displayName,places.formattedAddress';
        const COST_PER_PAGE = 0.032; 
        const TEXT_SEARCH_RESULT_LIMIT = 60; // Massimo teorico per Text Search New
        
        let allPlaces: RawDiscoveryContact[] = [];
        let costIncurred = 0.0;
        let nextPageToken: string | null = null;
        
        for (let page = 0; page < 3; page++) {
            const requestBody: any = { textQuery: queryText };
            if (nextPageToken) {
                requestBody.pageToken = nextPageToken;
            }

            try {
                const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': apiKey,
                        'X-Goog-FieldMask': fieldMask,
                    },
                    body: JSON.stringify(requestBody)
                });

                costIncurred += COST_PER_PAGE;

                if (!response.ok) {
                    const err = await response.text();
                    return { success: false, rawContacts: allPlaces, executionCost: costIncurred, resultLimit: TEXT_SEARCH_RESULT_LIMIT, error: `Google API Error: ${err}` };
                }

                const data = await response.json();
                
                if (data.places && Array.isArray(data.places)) {
                    for (const p of data.places) {
                        allPlaces.push({
                            source: 'GOOGLE',
                            sourceId: p.id,
                            rawName: p.displayName?.text || 'Sconosciuto',
                            rawAddress: p.formattedAddress || null
                        });
                    }
                }

                if (data.nextPageToken) {
                    nextPageToken = data.nextPageToken;
                    await new Promise(res => setTimeout(res, 2000));
                } else {
                    break; 
                }

            } catch (error: any) {
                return { success: false, rawContacts: allPlaces, executionCost: costIncurred, resultLimit: TEXT_SEARCH_RESULT_LIMIT, error: error.message };
            }
        }

        return {
            success: true,
            rawContacts: allPlaces,
            executionCost: costIncurred,
            resultLimit: TEXT_SEARCH_RESULT_LIMIT
        };
    }

    /**
     * Esegue una chiamata a Google Places API (New) - Nearby Search
     * Utilizzando locationRestriction.circle (Circle Geometry generata dal Quadtree).
     */
    static async nearbySearchDiscovery(query: any, apiKey: string): Promise<ExecutionEngineResult> {
        const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.location';
        const COST_PER_PAGE = 0.032; 
        const NEARBY_SEARCH_RESULT_LIMIT = 20; // Massimo restituibile da Nearby Search (New) per pagina
        
        let allPlaces: RawDiscoveryContact[] = [];
        let costIncurred = 0.0;
        let discardedOutOfBounds = 0;
        
        // Mappatura Concept -> IncludedPrimaryTypes (Google Nearby Search richiede i Type)
        const conceptLower = query.queryText.toLowerCase();
        let types = ['restaurant']; // fallback
        if (conceptLower.includes('pizzeria')) types = ['pizza_restaurant', 'restaurant'];
        else if (conceptLower.includes('idraulico')) types = ['plumber'];

        const requestBody: any = {
            includedPrimaryTypes: types,
            locationRestriction: {
                circle: {
                    center: {
                        latitude: query.searchCenterLat,
                        longitude: query.searchCenterLng
                    },
                    radius: query.searchRadius // in metri
                }
            },
            maxResultCount: NEARBY_SEARCH_RESULT_LIMIT 
        };

        try {
            const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': fieldMask,
                },
                body: JSON.stringify(requestBody)
            });

            costIncurred += COST_PER_PAGE;

            if (!response.ok) {
                const err = await response.text();
                return { success: false, rawContacts: allPlaces, executionCost: costIncurred, resultLimit: NEARBY_SEARCH_RESULT_LIMIT, error: `Google API Error: ${err}` };
            }

            const data = await response.json();
            
            if (data.places && Array.isArray(data.places)) {
                for (const p of data.places) {
                    const lat = p.location?.latitude;
                    const lng = p.location?.longitude;

                    // 2. Post-Filter Geografico sul Bounding Box (Quadtree Logico)
                    if (lat !== undefined && lng !== undefined) {
                        if (lat < query.cellMinLat || lat > query.cellMaxLat ||
                            lng < query.cellMinLng || lng > query.cellMaxLng) {
                            discardedOutOfBounds++;
                            continue; // Ignora se fisicamente fuori dalla cella logica
                        }
                    }

                    allPlaces.push({
                        source: 'GOOGLE',
                        sourceId: p.id,
                        rawName: p.displayName?.text || 'Sconosciuto',
                        rawAddress: p.formattedAddress || null,
                        lat, lng
                    });
                }
            }

            if (discardedOutOfBounds > 0) {
                console.log(`[GEO FILTER] Scartati ${discardedOutOfBounds} risultati trovati nel cerchio di raggio ma esterni alla cella quadrata.`);
            }

        } catch (error: any) {
            return { success: false, rawContacts: allPlaces, executionCost: costIncurred, resultLimit: NEARBY_SEARCH_RESULT_LIMIT, error: error.message };
        }

        return {
            success: true,
            rawContacts: allPlaces,
            executionCost: costIncurred,
            resultLimit: NEARBY_SEARCH_RESULT_LIMIT
        };
    }
}
