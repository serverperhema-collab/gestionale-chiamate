import { ExecutionEngineResult, RawDiscoveryContact } from './ExecutionInterfaces';

export class GooglePlacesAdapter {
    static async textSearchDiscovery(queryText: string, apiKey: string): Promise<ExecutionEngineResult> {
        return { success: false, rawContacts: [], executionCost: 0, resultLimit: 60 };
    }

    /**
     * Esegue una chiamata a Google Places API (New) - Text Search
     * Utilizzando locationRestriction.rectangle per mappare perfettamente la GeoCell!
     */
    static async nearbySearchDiscovery(concept: string, query: any, apiKey: string): Promise<ExecutionEngineResult> {
        const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.location';
        const COST_PER_PAGE = 0.032; 
        const TEXT_SEARCH_RESULT_LIMIT = 60; // 3 pagine da 20
        const PAGE_SIZE = 20;
        
        let allPlaces: RawDiscoveryContact[] = [];
        let costIncurred = 0.0;
        let nextPageToken: string | null = null;
        
        

        for (let page = 0; page < 3; page++) {
            const requestBody: any = {
                textQuery: concept,
                locationRestriction: {
                    rectangle: {
                        low: {
                            latitude: query.cellMinLat,
                            longitude: query.cellMinLng
                        },
                        high: {
                            latitude: query.cellMaxLat,
                            longitude: query.cellMaxLng
                        }
                    }
                },
                maxResultCount: PAGE_SIZE 
            };

            if (nextPageToken) {
                requestBody.pageToken = nextPageToken;
                // Google api requires removing some fields when using pageToken?
                // Actually in Places API (New), you pass pageToken inside the request body.
                // But you MUST NOT pass locationRestriction when using pageToken, or sometimes you MUST.
                // Let's assume it accepts the same body + pageToken.
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
                    // Se fallisce, ritorniamo i dati accumulati finora
                    return { success: false, rawContacts: allPlaces, executionCost: costIncurred, resultLimit: TEXT_SEARCH_RESULT_LIMIT, error: `Google API Error: ${err}` };
                }

                const data = await response.json();
                
                if (data.places && Array.isArray(data.places)) {
                    for (const p of data.places) {
                        const lat = p.location?.latitude;
                        const lng = p.location?.longitude;

                        // Safety check geometrico (Google è preciso, ma non si sa mai)
                        if (lat !== undefined && lng !== undefined) {
                            if (lat < query.cellMinLat || lat > query.cellMaxLat ||
                                lng < query.cellMinLng || lng > query.cellMaxLng) {
                                continue;
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

                if (data.nextPageToken) {
                    nextPageToken = data.nextPageToken;
                    // Evitiamo quota limits
                    await new Promise(res => setTimeout(res, 2000));
                } else {
                    break; // Niente più pagine
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
}

