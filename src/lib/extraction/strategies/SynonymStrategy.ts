import { ExtractionStrategy, StrategyType, PlannerContext, CandidateQuery } from './ExtractionStrategy';
import { BudgetControllerService } from '../BudgetControllerService';

const CATEGORY_SYNONYMS: Record<string, string[]> = {
    'Ristorante': ['Pizzeria', 'Trattoria', 'Osteria', 'Bistrot', 'Fast food'],
    'Idraulico': ['Termoidraulica', 'Impianti idraulici'],
};

export class SynonymStrategy implements ExtractionStrategy {
    readonly type: StrategyType = 'SYNONYM';

    async generateCandidates(context: PlannerContext): Promise<CandidateQuery[]> {
        const concept = context.family.concept;
        const synonyms = CATEGORY_SYNONYMS[concept] || [];
        
        return synonyms.map(syn => ({
            queryText: `${syn} in CAP ${context.job.cap}, Italia`,
            strategy: this.type,
            estimatedCost: BudgetControllerService.estimateQueryCost(this.type),
            gapMultiplier: 1.0 
        }));
    }
}
