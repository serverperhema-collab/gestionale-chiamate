import { RawDiscoveryContact } from './adapters/ExecutionInterfaces';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export class DedupeService {
    /**
     * Normalizza un indirizzo grezzo per estrarre Via e Civico in modo tollerante
     * ma sufficientemente preciso per la deduplica.
     */
    static normalizeAddress(rawAddress: string | null) {
        if (!rawAddress) return { street: null, number: null };
        
        // Semplificazione: converte in lowercase, rimuove punteggiatura
        let clean = rawAddress.toLowerCase().replace(/[,.-]/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Estrazione brutale civico (primo numero trovato dopo una parola)
        const matchNumber = clean.match(/(?:via|piazza|viale|corso|strada|largo|vicolo)?[a-z\s]+([0-9]+[a-z]?)/i);
        const number = matchNumber ? matchNumber[1] : null;

        // La via è tutto tranne il civico (molto semplificato per MVP)
        const street = number ? clean.replace(number, '').trim() : clean;

        return { 
            street: street || null, 
            number: number || null 
        };
    }

    static generateDedupeKey(rawName: string, street: string | null, number: string | null) {
        const normalizedName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normStreet = street ? street.replace(/[^a-z0-9]/g, '') : 'nostreet';
        const normNumber = number || 'nonumber';

        const rawString = `${normalizedName}|${normStreet}|${normNumber}`;
        return crypto.createHash('sha256').update(rawString).digest('hex');
    }

    /**
     * Valuta un array di contatti grezzi e restituisce solo quelli veramente nuovi.
     */
    static async deduplicate(contacts: RawDiscoveryContact[]) {
        let newContacts = [];
        let duplicateCount = 0;

        for (const c of contacts) {
            // 1. Controllo Vincolo Tecnico DB (source + sourceId)
            const exactDbMatch = await prisma.contact.findUnique({
                where: {
                    source_sourceId: {
                        source: c.source,
                        sourceId: c.sourceId
                    }
                }
            });

            if (exactDbMatch) {
                duplicateCount++;
                continue;
            }

            // 2. Normalizzazione
            const { street, number } = this.normalizeAddress(c.rawAddress);
            const dedupeKey = this.generateDedupeKey(c.rawName, street, number);

            // 3. Controllo Logico Applicativo (dedupeKey)
            // Questo ferma i cloni tra Google e OSM se Google l'ha chiamato "Pizzeria Roma" 
            // e OSM "Ristorante Pizzeria Roma" (assumendo il fuzzy match o la chiave esatta).
            // Per ora usiamo exact match sulla chiave normalizzata.
            const dedupeMatch = await prisma.contact.findFirst({
                where: { dedupeKey }
            });

            if (dedupeMatch) {
                duplicateCount++;
                continue;
            }

            newContacts.push({
                ...c,
                normalizedName: c.rawName.toLowerCase(),
                normalizedStreet: street,
                normalizedNumber: number,
                dedupeKey
            });
        }

        return { newContacts, duplicateCount };
    }
}
