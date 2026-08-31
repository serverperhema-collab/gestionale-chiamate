import { ExecutionEngineResult, RawDiscoveryContact } from './ExecutionInterfaces';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export class OsmAdapter {
    /**
     * Esegue una ricerca su Overpass API gestendo:
     * - Distributed Lock (SystemLock) per maxConcurrent=1
     * - Caching deterministico (OsmQueryCache)
     * - Backoff/Retry in caso di rate limit (HTTP 429)
     */
    static async overpassSearch(concept: string, cellMinLat: number, cellMaxLat: number, cellMinLng: number, cellMaxLng: number): Promise<ExecutionEngineResult> {
        const bbox = `${cellMinLat},${cellMinLng},${cellMaxLat},${cellMaxLng}`;
        const queryVersion = 'v1'; // Incrementare se si cambia la mappatura dei tag
        
        // 1. Check Cache
        const rawString = `${concept}_${bbox}_${queryVersion}`;
        const queryHash = crypto.createHash('sha256').update(rawString).digest('hex');

        const cached = await prisma.osmQueryCache.findUnique({ where: { queryHash } });
        
        if (cached) {
            // CACHE HIT
            if (cached.status === 'SUCCESS' && cached.resultData) {
                return {
                    success: true,
                    rawContacts: cached.resultData as unknown as RawDiscoveryContact[],
                    executionCost: 0,
                    resultLimit: 2000 // Overpass puo restituire molti risultati
                };
            } else if (cached.status === 'FAILED') {
                return {
                    success: false,
                    rawContacts: [],
                    executionCost: 0,
                    error: 'Cached failure'
                };
            }
        }

        // CACHE MISS -> Acquisizione Distributed Lock
        const lockKey = 'osm_overpass_lock';
        const lockTimeoutMs = 15000; // 15 secondi massimo per detenere il lock
        let lockAcquired = false;

        for (let i = 0; i < 15; i++) {
            try {
                await prisma.systemLock.deleteMany({
                    where: { key: lockKey, expiresAt: { lt: new Date() } }
                });

                await prisma.systemLock.create({
                    data: {
                        key: lockKey,
                        expiresAt: new Date(Date.now() + lockTimeoutMs)
                    }
                });
                lockAcquired = true;
                break;
            } catch (e) {
                await new Promise(res => setTimeout(res, 2000));
            }
        }

        if (!lockAcquired) {
            return {
                success: false,
                rawContacts: [],
                executionCost: 0,
                error: 'Could not acquire distributed OSM lock (timeout)'
            };
        }

        try {
            const conceptLower = concept.toLowerCase();
            let osmTag = '["amenity"="restaurant"]';
            if (conceptLower.includes('pizzeria')) osmTag = '["amenity"="restaurant"]["cuisine"~"pizza"]';
            else if (conceptLower.includes('idraulico')) osmTag = '["craft"="plumber"]';
            else if (conceptLower.includes('elettricista')) osmTag = '["craft"="electrician"]';
            
            const query = `
                [out:json][timeout:10];
                node${osmTag}(${bbox});
                out body;
            `;

            let response;
            let retries = 3;
            let backoffMs = 2000;

            while (retries > 0) {
                try {
                    response = await fetch('https://overpass-api.de/api/interpreter', {
                        method: 'POST',
                        body: 'data=' + encodeURIComponent(query),
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json',
                            'User-Agent': 'GestionaleEstrazioni/2.0'
                        }
                    });

                    if (response.ok) break;

                    if (response.status === 429) {
                        retries--;
                        await new Promise(res => setTimeout(res, backoffMs));
                        backoffMs *= 2; 
                    } else {
                        break;
                    }
                } catch (e) {
                    retries--;
                    await new Promise(res => setTimeout(res, backoffMs));
                    backoffMs *= 2;
                }
            }

            if (!response || !response.ok) {
                throw new Error(`Overpass API Error: ${response ? response.status : 'Network Error'}`);
            }

            const data = await response.json();
            const rawContacts: RawDiscoveryContact[] = [];

            if (data && data.elements) {
                for (const el of data.elements) {
                    const name = el.tags?.name || 'Sconosciuto';
                    const street = el.tags?.['addr:street'];
                    const housenumber = el.tags?.['addr:housenumber'];
                    
                    let address = null;
                    if (street && housenumber) address = `${street} ${housenumber}`;
                    else if (street) address = street;

                    rawContacts.push({
                        source: 'OSM',
                        sourceId: `osm_node_${el.id}`,
                        rawName: name,
                        rawAddress: address,
                        lat: el.lat,
                        lng: el.lon
                    });
                }
            }

            await prisma.osmQueryCache.upsert({
                where: { queryHash },
                create: {
                    queryHash,
                    concept,
                    bbox,
                    status: 'SUCCESS',
                    resultCount: rawContacts.length,
                    resultData: rawContacts as any,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                },
                update: {
                    status: 'SUCCESS',
                    resultCount: rawContacts.length,
                    resultData: rawContacts as any,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });

            return {
                success: true,
                rawContacts,
                executionCost: 0,
                resultLimit: 2000
            };

        } catch (error: any) {
            await prisma.osmQueryCache.upsert({
                where: { queryHash },
                create: {
                    queryHash,
                    concept,
                    bbox,
                    status: 'FAILED',
                    resultCount: 0,
                    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) 
                },
                update: {
                    status: 'FAILED',
                    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000)
                }
            });

            return {
                success: false,
                rawContacts: [],
                executionCost: 0,
                error: error.message
            };
        } finally {
            await prisma.systemLock.deleteMany({
                where: { key: lockKey }
            });
        }
    }
}


