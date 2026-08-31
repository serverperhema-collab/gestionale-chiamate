import { ExtractionStrategy, StrategyType, PlannerContext, CandidateQuery } from './ExtractionStrategy';
import { BudgetControllerService } from '../BudgetControllerService';

export class BaseStrategy implements ExtractionStrategy {
    readonly type: StrategyType = 'BASE';

    async generateCandidates(context: PlannerContext): Promise<CandidateQuery[]> {
        const queryText = `${context.family.concept} in CAP ${context.job.cap}, Italia`;

        return [{
            queryText,
            strategy: this.type,
            estimatedApiCost: BudgetControllerService.estimateQueryCost(this.type),
            estimatedOperationalCost: 0.1,
            gapMultiplier: 1.0 
        }];
    }
}

