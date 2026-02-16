import { Injectable, Logger } from '@nestjs/common';
import { CostEstimatorService } from './cost-estimator.service';

export interface CreditCalculationResult {
  credits: number;
  costCents: number;
  breakdown: string;
}

/** Cost in cents per 1 credit by plan tier (e.g. 1.90 EUR / 100 credits = 1.9 cents) */
const COST_PER_CREDIT_CENTS_BY_TIER: Record<string, number> = {
  free: 2.5,
  starter: 2.2,
  pro: 1.9,
  enterprise: 1.5,
  default: 1.9,
};

@Injectable()
export class DynamicCreditCalculatorService {
  private readonly logger = new Logger(DynamicCreditCalculatorService.name);

  constructor(private readonly costEstimator: CostEstimatorService) {}

  async calculateCredits(
    provider: string,
    model: string,
    operation: string,
    parameters?: Record<string, unknown>,
    planTier: string = 'default',
  ): Promise<CreditCalculationResult> {
    const estimate = await this.costEstimator.estimateCost(
      provider,
      model,
      operation,
    );

    const realCostCents = estimate.costCents;
    const costPerCredit =
      COST_PER_CREDIT_CENTS_BY_TIER[planTier] ??
      COST_PER_CREDIT_CENTS_BY_TIER.default;

    const credits = Math.max(
      1,
      Math.ceil(realCostCents / costPerCredit),
    );

    const breakdown =
      `provider=${provider} model=${model} operation=${operation} ` +
      `realCostCents=${realCostCents} costPerCredit=${costPerCredit} ` +
      `planTier=${planTier} => credits=${credits}`;

    return {
      credits,
      costCents: realCostCents,
      breakdown,
    };
  }
}
