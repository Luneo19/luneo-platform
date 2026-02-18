/**
 * @fileoverview Service de calcul des coûts LLM par provider et modèle
 * @module LLMCostCalculatorService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Coûts à jour (Décembre 2024)
 * - ✅ Calcul précis en centimes
 */

import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider, LLM_MODELS } from './llm-provider.enum';

// ============================================================================
// TYPES
// ============================================================================

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostCalculation {
  costCents: number;
  breakdown: {
    promptCostCents: number;
    completionCostCents: number;
  };
}

// ============================================================================
// COÛTS PAR PROVIDER/MODÈLE (Décembre 2024)
// ============================================================================

/**
 * Coûts par 1M tokens (input/output)
 * Source: Documentation officielle des providers (Décembre 2024)
 */
const COST_PER_1M_TOKENS: Record<
  LLMProvider,
  Record<string, { input: number; output: number }>
> = {
  [LLMProvider.OPENAI]: {
    'gpt-4o': { input: 2.5, output: 10 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gpt-4-turbo-preview': { input: 10, output: 30 },
    'gpt-4': { input: 30, output: 60 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  },
  [LLMProvider.ANTHROPIC]: {
    'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
    'claude-3-opus-20240229': { input: 15, output: 75 },
    'claude-3-sonnet-20240229': { input: 3, output: 15 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  },
  [LLMProvider.MISTRAL]: {
    'mistral-large-latest': { input: 2, output: 6 },
    'mistral-medium-latest': { input: 2.7, output: 8.1 },
    'mistral-small-latest': { input: 0.2, output: 0.6 },
  },
  [LLMProvider.GROQ]: {
    'llama-3.1-70b-versatile': { input: 0.59, output: 0.79 },
    'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
    'mixtral-8x7b-32768': { input: 0.24, output: 0.24 },
  },
  [LLMProvider.OLLAMA]: {
    'llama3': { input: 0, output: 0 },
    'mistral': { input: 0, output: 0 },
    'codellama': { input: 0, output: 0 },
  },
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class LLMCostCalculatorService {
  private readonly logger = new Logger(LLMCostCalculatorService.name);

  /**
   * Calcule le coût d'un appel LLM en centimes
   */
  calculateCost(
    provider: LLMProvider,
    model: string,
    usage: TokenUsage,
  ): CostCalculation {
    const costs = COST_PER_1M_TOKENS[provider]?.[model];

    if (!costs) {
      this.logger.warn(
        `Unknown model ${model} for provider ${provider}, using default costs`,
      );
      // Coûts par défaut (moyenne des modèles)
      return this.calculateWithDefaultCosts(usage);
    }

    // Calculer les coûts en centimes
    // Coût = (tokens / 1_000_000) * prix_par_1M_tokens
    const promptCostCents =
      (usage.promptTokens / 1_000_000) * costs.input * 100;
    const completionCostCents =
      (usage.completionTokens / 1_000_000) * costs.output * 100;

    const totalCostCents = Math.round(promptCostCents + completionCostCents);

    return {
      costCents: totalCostCents,
      breakdown: {
        promptCostCents: Math.round(promptCostCents),
        completionCostCents: Math.round(completionCostCents),
      },
    };
  }

  /**
   * Calcule le coût estimé avant l'appel (pour budget check)
   */
  estimateCost(
    provider: LLMProvider,
    model: string,
    estimatedTokens: number,
  ): number {
    const costs = COST_PER_1M_TOKENS[provider]?.[model];

    if (!costs) {
      // Estimation conservatrice: moyenne input/output (defaults when model unknown)
      const avgCost = (5 + 15) / 2;
      return Math.round((estimatedTokens / 1_000_000) * avgCost * 100);
    }

    // Estimation: 70% input, 30% output (ratio typique)
    const estimatedPromptTokens = Math.round(estimatedTokens * 0.7);
    const estimatedCompletionTokens = Math.round(estimatedTokens * 0.3);

    const promptCostCents =
      (estimatedPromptTokens / 1_000_000) * costs.input * 100;
    const completionCostCents =
      (estimatedCompletionTokens / 1_000_000) * costs.output * 100;

    return Math.round(promptCostCents + completionCostCents);
  }

  /**
   * Calcule avec des coûts par défaut si modèle inconnu
   */
  private calculateWithDefaultCosts(usage: TokenUsage): CostCalculation {
    // Coûts moyens conservateurs
    const avgInputCost = 5; // $5 per 1M tokens
    const avgOutputCost = 15; // $15 per 1M tokens

    const promptCostCents = (usage.promptTokens / 1_000_000) * avgInputCost * 100;
    const completionCostCents =
      (usage.completionTokens / 1_000_000) * avgOutputCost * 100;

    return {
      costCents: Math.round(promptCostCents + completionCostCents),
      breakdown: {
        promptCostCents: Math.round(promptCostCents),
        completionCostCents: Math.round(completionCostCents),
      },
    };
  }

  /**
   * Retourne les coûts pour un modèle spécifique (pour affichage)
   */
  getModelCosts(
    provider: LLMProvider,
    model: string,
  ): { input: number; output: number } | null {
    return COST_PER_1M_TOKENS[provider]?.[model] || null;
  }

  /**
   * Retourne le modèle le moins cher pour une tâche
   */
  getCheapestModel(
    provider: LLMProvider,
    taskComplexity: 'simple' | 'complex' = 'simple',
  ): { provider: LLMProvider; model: string; costPer1M: number } {
    const models = COST_PER_1M_TOKENS[provider];

    if (!models) {
      // Fallback vers Mistral Small (le moins cher)
      return {
        provider: LLMProvider.MISTRAL,
        model: LLM_MODELS.mistral.MISTRAL_SMALL,
        costPer1M: 0.2,
      };
    }

    // Pour tâches simples, prioriser les modèles rapides et peu chers
    if (taskComplexity === 'simple') {
      // Chercher le modèle avec le coût input le plus bas
      const cheapest = Object.entries(models).reduce(
        (min, [model, costs]) => {
          const avgCost = (costs.input + costs.output) / 2;
          return avgCost < min.cost ? { model, cost: avgCost } : min;
        },
        { model: '', cost: Infinity },
      );

      return {
        provider,
        model: cheapest.model,
        costPer1M: cheapest.cost,
      };
    }

    // Pour tâches complexes, utiliser le meilleur modèle disponible
    return {
      provider,
      model: Object.keys(models)[0],
      costPer1M: (models[Object.keys(models)[0]].input + models[Object.keys(models)[0]].output) / 2,
    };
  }
}
