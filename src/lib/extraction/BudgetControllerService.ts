import { PrismaClient } from '@prisma/client';

export const GOOGLE_PRICING = {
    TEXT_SEARCH_DISCOVERY: 0.032, // Solo Basic Data (Name, Address, Location)
    NEARBY_SEARCH_DISCOVERY: 0.032, // Basic Data
    PLACE_DETAILS_ENRICHMENT: 0.017 + 0.003, // Esempio: Basic + Contact Data
};

export class BudgetControllerService {
    /**
     * Incrementa il costo consumato dal Job in modo atomico, all'interno della transazione.
     */
    static async addCostInTransaction(
        tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
        jobId: string,
        costIncurred: number
    ) {
        if (costIncurred <= 0) return;

        await tx.scrapingJob.update({
            where: { id: jobId },
            data: {
                queriesExecuted: { increment: 1 },
                currentCost: { increment: costIncurred }
            }
        });
    }

    /**
     * Calcola il costo atteso di una query in base all'endpoint e ai campi
     */
    static estimateQueryCost(strategyType: string): number {
        // Al momento BASE, SYNONYM, GEO_CELL usano Text/Nearby Discovery
        if (strategyType === 'OSM_SEED') {
            return 0.0; // OSM è gratis
        }
        return GOOGLE_PRICING.TEXT_SEARCH_DISCOVERY;
    }
}
