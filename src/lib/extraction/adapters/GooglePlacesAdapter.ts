import { ExecutionEngineResult, RawDiscoveryContact } from './ExecutionInterfaces';
import { getGoogleIncludedType } from './GoogleTypeMapper';

export class GooglePlacesAdapter {
    /**
     * Esegue una chiamata a Google Places API (New) - Text Search per le query BASE/SYNONYM
     */
    static async textSearchDiscovery(queryText: string, apiKey: string): Promise<ExecutionEngineResult> {
        const fieldMask = 'places.id,places.displayName,places.formattedAddress';
        const COST_PER_PAGE = 0.032; 
        const TEXT_SEARCH_RESULT_LIMIT = 60; 
        
        let allPlaces: RawDiscoveryContact[] = [];
        let costIncurred = 0.0;
        let nextPageToken: string | null = null;
        
        // Estraiamo il concept rimuovendo " in CAP..." o " in cella..." se presenti, per il mapper
        let concept = queryText.split(' in ')[0].trim();
        const includedType = getGoogleIncludedType(concept);

        for (let page = 0; page < 3; page++) {
            const requestBody: any = { textQuery: queryText };
            if (includedType) {
                requestBody.includedType = includedType;
                requestBody.strictTypeFiltering = true;
            }

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
        
        const includedType = getGoogleIncludedType(concept);

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

            if (includedType) {
                requestBody.includedType = includedType;
                requestBody.strictTypeFiltering = true;
            }

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
                        const lat = p.location?.latitude;
                        const lng = p.location?.longitude;

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
}
