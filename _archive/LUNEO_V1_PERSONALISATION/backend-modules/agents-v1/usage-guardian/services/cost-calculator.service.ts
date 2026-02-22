/**
 * @fileoverview Service de calcul des coûts IA en temps réel
 * @module CostCalculatorService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites (zéro 'any')
 * - ✅ Coûts à jour (Décembre 2024)
 * - ✅ Calcul précis en centimes
 * - ✅ Estimation avant exécution
 */

import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// TYPES
// ============================================================================

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostCalculation {
  costCents: number;
  breakdown: {
    inputCostCents: number;
    outputCostCents: number;
  };
}

export interface CostEstimate {
  estimatedCostCents: number;
  minCostCents: number;
  maxCostCents: number;
  confidence: 'low' | 'medium' | 'high';
}

// ============================================================================
// COÛTS PAR PROVIDER/MODÈLE (Décembre 2024)
// ============================================================================

/**
 * Coûts par 1M tokens (input/output) en dollars
 * Source: Documentation officielle des providers (Décembre 2024)
 */
const COST_PER_1M_TOKENS: Record<
  string,
  Record<string, { input: number; output: number }>
> = {
  openai: {
    'gpt-4o': { input: 2.5, output: 10 }, // $2.5/$10 per 1M tokens
    'gpt-4o-mini': { input: 0.15, output: 0.6 }, // $0.15/$0.6 per 1M tokens
    'gpt-4-turbo': { input: 10, output: 30 }, // $10/$30 per 1M tokens
    'gpt-4': { input: 30, output: 60 }, // $30/$60 per 1M tokens
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 }, // $0.5/$1.5 per 1M tokens
  },
  anthropic: {
    'claude-3-5-sonnet-20241022': { input: 3, output: 15 }, // $3/$15 per 1M tokens
    'claude-3-opus-20240229': { input: 15, output: 75 }, // $15/$75 per 1M tokens
    'claude-3-sonnet-20240229': { input: 3, output: 15 }, // $3/$15 per 1M tokens
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 }, // $0.25/$1.25 per 1M tokens
  },
  mistral: {
    'mistral-large-latest': { input: 2, output: 6 }, // $2/$6 per 1M tokens
    'mistral-medium-latest': { input: 2.7, output: 8.1 }, // $2.7/$8.1 per 1M tokens
    'mistral-small-latest': { input: 0.2, output: 0.6 }, // $0.2/$0.6 per 1M tokens
  },
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class CostCalculatorService {
  private readonly logger = new Logger(CostCalculatorService.name);

  /**
   * Calcule le coût réel d'un appel LLM en centimes
   */
  calculateCost(
    provider: string,
    model: string,
    usage: TokenUsage,
  ): CostCalculation {
    const providerKey = provider.toLowerCase();
    const costs = COST_PER_1M_TOKENS[providerKey]?.[model];

    if (!costs) {
      this.logger.warn(
        `Unknown model ${model} for provider ${provider}, using default costs`,
      );
      return this.calculateWithDefaultCosts(usage);
    }

    // Calculer les coûts en centimes
    // Coût = (tokens / 1_000_000) * prix_par_1M_tokens * 100 (pour centimes)
    const inputCostCents = (usage.inputTokens / 1_000_000) * costs.input * 100;
    const outputCostCents = (usage.outputTokens / 1_000_000) * costs.output * 100;

    const totalCostCents = Math.round(inputCostCents + outputCostCents);

    return {
      costCents: totalCostCents,
      breakdown: {
        inputCostCents: Math.round(inputCostCents),
        outputCostCents: Math.round(outputCostCents),
      },
    };
  }

  /**
   * Estime le coût avant exécution
   */
  estimateCost(
    provider: string,
    model: string,
    estimatedInputTokens: number,
    estimatedOutputTokens: number,
  ): CostEstimate {
    const providerKey = provider.toLowerCase();
    const costs = COST_PER_1M_TOKENS[providerKey]?.[model];

    if (!costs) {
      // Estimation conservative
      return {
        estimatedCostCents: Math.round((estimatedInputTokens + estimatedOutputTokens) / 1000), // ~1 centime per 1K tokens
        minCostCents: Math.round((estimatedInputTokens + estimatedOutputTokens) / 2000),
        maxCostCents: Math.round((estimatedInputTokens + estimatedOutputTokens) / 500),
        confidence: 'low',
      };
    }

    // Estimation basée sur les coûts réels
    const estimatedInputCost = (estimatedInputTokens / 1_000_000) * costs.input * 100;
    const estimatedOutputCost = (estimatedOutputTokens / 1_000_000) * costs.output * 100;
    const estimatedTotal = estimatedInputCost + estimatedOutputCost;

    // Variation de ±20% pour l'incertitude
    const minCost = estimatedTotal * 0.8;
    const maxCost = estimatedTotal * 1.2;

    return {
      estimatedCostCents: Math.round(estimatedTotal),
      minCostCents: Math.round(minCost),
      maxCostCents: Math.round(maxCost),
      confidence: 'high',
    };
  }

  /**
   * Récupère les coûts par provider
   */
  getProviderCosts(provider: string): Record<string, { input: number; output: number }> | null {
    const providerKey = provider.toLowerCase();
    return COST_PER_1M_TOKENS[providerKey] || null;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Calcule avec des coûts par défaut (moyenne)
   */
  private calculateWithDefaultCosts(usage: TokenUsage): CostCalculation {
    // Coûts moyens: $5/$15 per 1M tokens
    const avgInputCost = 5;
    const avgOutputCost = 15;

    const inputCostCents = (usage.inputTokens / 1_000_000) * avgInputCost * 100;
    const outputCostCents = (usage.outputTokens / 1_000_000) * avgOutputCost * 100;

    return {
      costCents: Math.round(inputCostCents + outputCostCents),
      breakdown: {
        inputCostCents: Math.round(inputCostCents),
        outputCostCents: Math.round(outputCostCents),
      },
    };
  }
}
