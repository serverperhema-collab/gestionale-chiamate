import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CATEGORIES } from '@/data/categories';
import fs from 'fs';
import path from 'path';

const DEFAULT_API_KEY = 'AIzaSyDzqL969UwwFFPV4x_vJJCJY4WCMgnJzkA';

const BLACKLIST = [
  "polizia", "carabinieri", "municipio", "caserma", "caserme", 
  "parco pubblico", "parchi pubblici", "aeroporto", "stazione ferroviaria", 
  "stazione bus", "fermata bus", "vigili del fuoco", "comune di"
];

function isBlacklisted(name: string): boolean {
  if (!name) return false;
  const lowerName = name.toLowerCase();
  return BLACKLIST.some(term => lowerName.includes(term));
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const cap = searchParams.get('cap') || '00100';
  const API_KEY = searchParams.get('apikey') || DEFAULT_API_KEY;
  const source = searchParams.get('source') || 'google';
  
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const log = async (msg: string) => {
    try {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ message: msg })}\n\n`));
    } catch(e) {}
  };

  const closeStream = async () => {
    try {
        await writer.write(encoder.encode(`data: [DONE]\n\n`));
        await writer.close();
    } catch(e) {}
  };

  async function fetchWithRetry(url: string, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'GestionaleEstrazioni/2.0 (Mozilla/5.0)'
            }
        });
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error(`Risposta non valida (probabile sovraccarico server): ${text.substring(0, 30)}...`);
        }
      } catch (e) {
        if (i === retries - 1) throw e;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // --- GOOGLE MAPS FUNCTIONS ---
  let sessionApiHits = 0;

  async function searchPlacesGoogle(query: string) {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
    let results: any[] = [];
    while (true) {
      const response = await fetchWithRetry(url);
      sessionApiHits++;
      if (response && response.status === 'OK' && response.results) {
        results.push(...response.results);
      }
      if (response && response.next_page_token) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${response.next_page_token}&key=${API_KEY}`;
      } else {
        break;
      }
    }
    return results;
  }

  const typeTranslations: Record<string, string> = {
    restaurant: "Ristorante", cafe: "Caffetteria", bar: "Bar", bakery: "Panetteria",
    supermarket: "Supermercato", clothing_store: "Negozio Abbigliamento", shoe_store: "Negozio Scarpe",
    electronics_store: "Elettronica", hardware_store: "Ferramenta", jewelry_store: "Gioielleria",
    pet_store: "Negozio Animali", pharmacy: "Farmacia", hospital: "Ospedale", dentist: "Dentista",
    doctor: "Medico", spa: "Centro Benessere", beauty_salon: "Centro Estetico", hair_care: "Parrucchiere",
    lawyer: "Avvocato", accounting: "Commercialista", real_estate_agency: "Agenzia Immobiliare",
    insurance_agency: "Agenzia Assicurativa", bank: "Banca", plumber: "Idraulico",
    electrician: "Elettricista", car_repair: "Meccanico", locksmith: "Fabbro",
    painter: "Imbianchino", store: "Negozio", establishment: "Attività",
    driving_school: "Autoscuola", gym: "Palestra", sports_complex: "Centro Sportivo", sports_club: "Circolo Sportivo"
  };

  async function getPlaceDetailsGoogle(placeId: string) {
    const fields = "name,formatted_phone_number,opening_hours,formatted_address,website,business_status,url,types";
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;
    const response = await fetchWithRetry(url);
    if (response && response.status === 'OK') {
      return response.result || {};
    }
    return {};
  }

  async function formatHoursGoogle(openingHours: any) {
    if (!openingHours || !openingHours.weekday_text) return "Orari non disponibili";
    return openingHours.weekday_text.join(" | ");
  }

  async function getBoundingBox(capCode: string) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${capCode}|country:IT&key=${API_KEY}`;
    const res = await fetchWithRetry(url);
    if (res && res.status === 'OK' && res.results.length > 0) {
      const viewport = res.results[0].geometry.viewport;
      // Overpass vuole: lat min (south), lon min (west), lat max (north), lon max (east)
      return `${viewport.southwest.lat},${viewport.southwest.lng},${viewport.northeast.lat},${viewport.northeast.lng}`;
    }
    return null;
  }

  // --- OSM OVERPASS FUNCTIONS ---
  async function searchPlacesOSM(capCode: string, selectedIds: string[]) {
    await log(`Identifico i confini esatti del CAP ${capCode}...`);
    const bbox = await getBoundingBox(capCode);
    
    if (!bbox) {
        await log(`❌ Impossibile trovare le coordinate geografiche per il CAP ${capCode}.`);
        return [];
    }

    await log(`Interrogo OpenStreetMap all'interno dell'area trovata...`);
    
    // Usiamo ampie categorie OSM per prendere tutto ciò che è business/servizio
    const nwrQueries = `
      nwr(${bbox})["shop"];
      nwr(${bbox})["office"];
      nwr(${bbox})["craft"];
      nwr(${bbox})["amenity"];
      nwr(${bbox})["leisure"];
    `;

    const query = `[out:json][timeout:60];(${nwrQueries});out center tags;`;
    
    try {
      const data = await fetchWithRetry(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (data && data.elements) {
        return data.elements.filter((el: any) => el.tags && el.tags.name);
      }
      return [];
    } catch (e) {
      await log(`Errore OSM: ${e}`);
      return [];
    }
  }


  // Esecuzione in background
  (async () => {
    try {
      let totalFound = 0;
      let added = 0;
      let discarded = 0;

      if (source === 'google') {
          // Prendi tutti i googleTypes possibili da tutte le categorie per fare un crawling totale
          let googleTypes: string[] = [];
          CATEGORIES.forEach(c => {
              googleTypes.push(...c.googleTypes);
          });
          // Aggiungiamo anche query generiche per coprire i "buchi"
          googleTypes.push("establishment", "point_of_interest", "business", "store", "office", "services");
          googleTypes = [...new Set(googleTypes)];

          const aziendeTrovate = new Map<string, any>(); 
          
          await log(`Avvio scansione Google su CAP ${cap} per ${googleTypes.length} tipologie...`);
          
          for (let i = 0; i < googleTypes.length; i++) {
              const cat = googleTypes[i];
              await log(`Cerco tipologia: ${cat} (${i+1}/${googleTypes.length})...`);
              const queryTranslated = typeTranslations[cat] ? typeTranslations[cat] : cat.replace(/_/g, ' ');
              const luoghi = await searchPlacesGoogle(`${queryTranslated} in CAP ${cap}, Italia`);
              for (const l of luoghi) {
                  // Filtro Stringente: accettiamo solo se l'indirizzo contiene esplicitamente il CAP cercato
                  if (l.formatted_address && l.formatted_address.includes(cap)) {
                      if (!aziendeTrovate.has(l.place_id)) {
                          aziendeTrovate.set(l.place_id, l);
                      }
                  }
              }
          }

          const arrayAziende = Array.from(aziendeTrovate.values());
          totalFound = arrayAziende.length;
          await log(`Trovate ${totalFound} aziende uniche. Filtraggio e salvataggio in corso...`);
          
          for (let i = 0; i < arrayAziende.length; i++) {
              const l = arrayAziende[i];
              
              if (isBlacklisted(l.name)) {
                  discarded++;
                  continue;
              }

              const existing = await prisma.contact.findUnique({ where: { placeId: l.place_id } });
              if (existing) {
                  discarded++;
                  continue;
              }

              if (i % 5 === 0) await log(`Aggiunte ${added} aziende su ${totalFound}...`);

              const telefono = "N/D";
              const orari = "N/D";
              
              let clientSector = "Generico";
              if (l.types && l.types.length > 0) {
                  let found = false;
                  // Scorriamo tutti i tipi assegnati da Google per trovare il più pertinente
                  for (const t of l.types) {
                      const matchingConfig = CATEGORIES.find(c => c.googleTypes.includes(t));
                      if (matchingConfig) {
                          clientSector = matchingConfig.label;
                          found = true;
                          break;
                      }
                  }
                  // Se non troviamo nessuna corrispondenza esatta, usiamo un fallback
                  if (!found) {
                      // Ignoriamo i tag generici inutili se possibile
                      const fallbackType = l.types.find((t: string) => t !== 'point_of_interest' && t !== 'establishment') || l.types[0];
                      clientSector = typeTranslations[fallbackType] || fallbackType.replace(/_/g, ' ');
                      clientSector = clientSector.charAt(0).toUpperCase() + clientSector.slice(1);
                  }
              }
              
              // Estrazione CAP reale dall'indirizzo fornito da Google
              const matchCap = l.formatted_address.match(/\b\d{5}\b/);
              const actualCap = matchCap ? matchCap[0] : cap;
              
              await prisma.contact.create({
                  data: {
                      placeId: l.place_id,
                      name: l.name,
                      originalPhone: telefono,
                      hours: orari,
                      cap: actualCap,
                      sector: clientSector,
                      address: l.formatted_address,
                      website: "N/D",
                      businessStatus: l.business_status || "OPERATIONAL",
                      url: `https://www.google.com/maps/place/?q=place_id:${l.place_id}`
                  }
              });
              added++;
              await new Promise(resolve => setTimeout(resolve, 100)); // Pausa anti-spam
          }

      } else {
          const elementi = await searchPlacesOSM(cap, []);
          totalFound = elementi.length;
          await log(`Trovate ${totalFound} aziende uniche su OSM. Filtraggio e salvataggio in corso...`);

          for (let i = 0; i < elementi.length; i++) {
              const el = elementi[i];
              const name = el.tags.name;
              
              if (isBlacklisted(name)) {
                  discarded++;
                  continue;
              }
              
              // Filtro Stringente per OSM: se il nodo ha un CAP, deve combaciare con quello cercato.
              // (Molti nodi OSM non hanno il CAP, in quel caso li teniamo assumendo siano nel bounding box corretto)
              const nodeCap = el.tags['addr:postcode'];
              if (nodeCap && nodeCap !== cap) {
                  discarded++;
                  continue;
              }

              const placeId = `osm_${el.id}`;
              const existing = await prisma.contact.findUnique({ where: { placeId } });
              if (existing) {
                  discarded++;
                  continue;
              }

              if (i % 10 === 0 && i !== 0) await log(`Aggiunte ${added} aziende su ${totalFound}...`);

              const phone = el.tags.phone || el.tags['contact:phone'] || "N/D";
              const website = el.tags.website || el.tags['contact:website'] || null;
              const hours = el.tags.opening_hours || "Orari non disponibili";
              
              const street = el.tags['addr:street'] || "";
              const housenumber = el.tags['addr:housenumber'] || "";
              const city = el.tags['addr:city'] || "";
              const address = street ? `${street} ${housenumber}, ${city}`.trim() : "Indirizzo generico";
              const url = `https://www.openstreetmap.org/${el.type}/${el.id}`;
              
              let clientSector = "Generico";
              const primaryTag = el.tags.shop || el.tags.amenity || el.tags.office || el.tags.craft || el.tags.leisure;
              
              if (primaryTag) {
                  // Proviamo a trovare il matching in categories.ts
                  const fullTag = el.tags.shop ? `shop=${primaryTag}` : 
                                  el.tags.amenity ? `amenity=${primaryTag}` : 
                                  el.tags.office ? `office=${primaryTag}` : 
                                  el.tags.leisure ? `leisure=${primaryTag}` :
                                  `craft=${primaryTag}`;
                                  
                  const matchingConfig = CATEGORIES.find(c => c.osmTags.includes(fullTag) || c.osmTags.includes(primaryTag));
                  if (matchingConfig) {
                      clientSector = matchingConfig.label;
                  } else {
                      clientSector = typeTranslations[primaryTag] || primaryTag.replace(/_/g, ' ');
                      clientSector = clientSector.charAt(0).toUpperCase() + clientSector.slice(1);
                  }
              }

              const actualCap = el.tags['addr:postcode'] || cap;

              await prisma.contact.create({
                  data: {
                      placeId,
                      name,
                      originalPhone: phone,
                      hours,
                      cap: actualCap,
                      sector: clientSector,
                      address,
                      website,
                      businessStatus: 'OPERATIONAL', 
                      url
                  }
              });
              added++;
          }
      }
      
      await log(`-----------------------------------------------------`);
      await log(`📊 RESOCONTO FINALE ESTRAZIONE:`);
      await log(`- Totale aziende trovate: ${totalFound}`);
      await log(`- Nuove aziende aggiunte: ${added}`);
      await log(`- Aziende scartate (già presenti o Blacklist): ${discarded}`);
      await log(`-----------------------------------------------------`);
      
      if (source === 'google' && sessionApiHits > 0) {
          const filePath = path.join(process.cwd(), 'src', 'data', 'expenses.json');
          let totalCalls = 0;
          try {
              if (fs.existsSync(filePath)) {
                  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                  totalCalls = data.totalCalls || 0;
              }
          } catch (e) {}
          
          totalCalls += sessionApiHits;
          try {
              fs.writeFileSync(filePath, JSON.stringify({ totalCalls }, null, 2));
          } catch(e) {}
          
          const sessionCost = sessionApiHits * 0.032;
          const totalCost = totalCalls * 0.032;
          
          const formattedSession = sessionCost.toFixed(2).replace('.', ',');
          const formattedTotal = totalCost.toFixed(2).replace('.', ',');
          
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              message: `💰 COSTO GOOGLE MAPS PER QUESTA RICERCA: $${formattedSession} | COSTO TOTALE STORICO: $${formattedTotal}`,
              expense: { session: sessionCost, total: totalCost } 
          })}\n\n`));
      }
      
    } catch (e: any) {
      await log(`ERRORE CRITICO: ${e.message}`);
    } finally {
      await closeStream();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
