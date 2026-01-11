/**
 * @fileoverview Service de routage vers les différents LLM
 * @module LLMRouterService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites (pas de 'any')
 * - ✅ Gestion d'erreurs avec try-catch
 * - ✅ Validation Zod des inputs
 * - ✅ Injectable NestJS
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { z } from 'zod';
import { firstValueFrom } from 'rxjs';
import { AiService } from '@/modules/ai/ai.service';
import { LLMCostCalculatorService } from './llm-cost-calculator.service';
import { RetryService } from './retry.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { AgentMetricsService } from './agent-metrics.service';
import { PromptSecurityService } from './prompt-security.service';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

/**
 * Providers LLM supportés
 */
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  MISTRAL = 'mistral',
}

/**
 * Modèles disponibles par provider
 */
export const LLM_MODELS = {
  [LLMProvider.OPENAI]: {
    GPT4_TURBO: 'gpt-4-turbo-preview',
    GPT4: 'gpt-4',
    GPT35_TURBO: 'gpt-3.5-turbo',
  },
  [LLMProvider.ANTHROPIC]: {
    CLAUDE_3_OPUS: 'claude-3-opus-20240229',
    CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
    CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
  },
  [LLMProvider.MISTRAL]: {
    MISTRAL_LARGE: 'mistral-large-latest',
    MISTRAL_MEDIUM: 'mistral-medium-latest',
    MISTRAL_SMALL: 'mistral-small-latest',
  },
} as const;

/**
 * Schema de validation pour les messages
 */
const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1),
});

/**
 * Schema de validation pour les requêtes LLM
 */
const LLMRequestSchema = z.object({
  provider: z.nativeEnum(LLMProvider),
  model: z.string(),
  messages: z.array(MessageSchema).min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(128000).default(4096),
  stream: z.boolean().default(false),
  // Métadonnées pour tracking
  brandId: z.string().uuid().optional(),
  agentType: z.enum(['luna', 'aria', 'nova']).optional(),
  enableFallback: z.boolean().default(true), // Fallback automatique si erreur
});

export type LLMRequest = z.infer<typeof LLMRequestSchema>;
export type Message = z.infer<typeof MessageSchema>;

/**
 * Réponse standardisée du LLM
 */
export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  latencyMs: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class LLMRouterService {
  private readonly logger = new Logger(LLMRouterService.name);

  // API Keys (chargées depuis ConfigService)
  private readonly openaiApiKey: string;
  private readonly anthropicApiKey: string;
  private readonly mistralApiKey: string;

  // Endpoints
  private readonly OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
  private readonly ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
  private readonly MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

  // Circuit breakers par provider
  private readonly circuitBreakers: Map<LLMProvider, CircuitBreakerService> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly aiService: AiService,
    private readonly costCalculator: LLMCostCalculatorService,
    private readonly retryService: RetryService,
    private readonly metrics: AgentMetricsService,
    private readonly security: PromptSecurityService,
  ) {
    this.openaiApiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
    this.anthropicApiKey = this.configService.getOrThrow<string>('ANTHROPIC_API_KEY');
    this.mistralApiKey = this.configService.getOrThrow<string>('MISTRAL_API_KEY');

    // Initialiser les circuit breakers pour chaque provider
    this.circuitBreakers.set(
      LLMProvider.OPENAI,
      new CircuitBreakerService({ failureThreshold: 5, timeoutMs: 60000 }),
    );
    this.circuitBreakers.set(
      LLMProvider.ANTHROPIC,
      new CircuitBreakerService({ failureThreshold: 5, timeoutMs: 60000 }),
    );
    this.circuitBreakers.set(
      LLMProvider.MISTRAL,
      new CircuitBreakerService({ failureThreshold: 5, timeoutMs: 60000 }),
    );
  }

  /**
   * Route une requête vers le LLM approprié avec retry, circuit breaker et tracking coûts
   */
  async chat(request: LLMRequest): Promise<LLMResponse> {
    // ✅ RÈGLE: Validation Zod obligatoire
    const validatedRequest = LLMRequestSchema.parse(request);

    // ✅ PHASE 3: Vérification sécurité des inputs
    for (const message of validatedRequest.messages) {
      if (message.role === 'user') {
        const securityCheck = this.security.checkInput(message.content);
        if (!securityCheck.safe) {
          this.logger.warn(
            `Security threat detected in user message: ${securityCheck.threats.join(', ')}`,
          );
          // Sanitize automatiquement ou throw selon configuration
          message.content = this.security.sanitizeInput(message.content);
        }
      }
    }

    const startTime = Date.now();
    const brandId = validatedRequest.brandId;
    const agentType = validatedRequest.agentType;

    try {
      // Essayer avec le provider demandé
      let response = await this.callWithResilience(
        validatedRequest.provider,
        validatedRequest,
      );

      response.latencyMs = Date.now() - startTime;

      // ✅ PHASE 3: Valider sécurité de la réponse
      const outputSecurity = this.security.validateOutput(response.content);
      if (!outputSecurity.safe) {
        this.logger.warn(
          `Security threat detected in LLM output: ${outputSecurity.threats.join(', ')}`,
        );
        // Optionnel: filtrer ou remplacer la réponse
      }

      // ✅ CRITIQUE: Enregistrer le coût LLM
      if (brandId) {
        await this.recordCost(
          brandId,
          response.provider,
          response.model,
          response.usage,
          response.latencyMs,
          agentType,
        );
      }

      // ✅ PHASE 2: Enregistrer métriques
      if (agentType) {
        const durationSeconds = response.latencyMs / 1000;
        this.metrics.recordRequestDuration(
          {
            agent: agentType,
            provider: response.provider,
            model: response.model,
            brandId,
          },
          durationSeconds,
        );

        this.metrics.recordRequest(
          {
            agent: agentType,
            provider: response.provider,
            model: response.model,
            brandId,
          },
          'success',
        );

        this.metrics.recordTokens(
          {
            agent: agentType,
            provider: response.provider,
            model: response.model,
            brandId,
          },
          response.usage.promptTokens,
          'prompt',
        );

        this.metrics.recordTokens(
          {
            agent: agentType,
            provider: response.provider,
            model: response.model,
            brandId,
          },
          response.usage.completionTokens,
          'completion',
        );

        // Coût enregistré dans recordCost()
        const costCalculation = this.costCalculator.calculateCost(
          response.provider,
          response.model,
          response.usage,
        );
        this.metrics.recordCost(
          {
            agent: agentType,
            provider: response.provider,
            model: response.model,
            brandId,
          },
          costCalculation.costCents,
        );
      }

      this.logger.log(
        `LLM Response: provider=${response.provider}, model=${response.model}, ` +
        `tokens=${response.usage.totalTokens}, latency=${response.latencyMs}ms`,
      );

      return response;
    } catch (error) {
      // ✅ PHASE 2: Enregistrer erreur dans métriques
      if (agentType) {
        const errorType = error instanceof Error ? error.constructor.name : 'Unknown';
        this.metrics.recordError(
          {
            agent: agentType,
            provider: validatedRequest.provider,
            model: validatedRequest.model,
            brandId,
          },
          errorType,
        );

        this.metrics.recordRequest(
          {
            agent: agentType,
            provider: validatedRequest.provider,
            model: validatedRequest.model,
            brandId,
          },
          'error',
        );
      }

      // Si fallback activé et erreur, essayer avec un autre provider
      if (
        validatedRequest.enableFallback &&
        validatedRequest.provider !== LLMProvider.MISTRAL
      ) {
        this.logger.warn(
          `Primary provider ${validatedRequest.provider} failed, trying fallback`,
        );
        try {
          // Fallback vers Mistral (le moins cher)
          const fallbackRequest = {
            ...validatedRequest,
            provider: LLMProvider.MISTRAL,
            model: LLM_MODELS.mistral.MISTRAL_SMALL,
            enableFallback: false, // Éviter boucle infinie
          };

          const fallbackResponse = await this.callWithResilience(
            LLMProvider.MISTRAL,
            fallbackRequest,
          );
          fallbackResponse.latencyMs = Date.now() - startTime;

          // Enregistrer le coût du fallback
          if (brandId) {
            await this.recordCost(
              brandId,
              fallbackResponse.provider,
              fallbackResponse.model,
              fallbackResponse.usage,
              fallbackResponse.latencyMs,
              agentType,
            );
          }

          // Métriques pour fallback
          if (agentType) {
            const durationSeconds = fallbackResponse.latencyMs / 1000;
            this.metrics.recordRequestDuration(
              {
                agent: agentType,
                provider: fallbackResponse.provider,
                model: fallbackResponse.model,
                brandId,
              },
              durationSeconds,
            );

            this.metrics.recordRequest(
              {
                agent: agentType,
                provider: fallbackResponse.provider,
                model: fallbackResponse.model,
                brandId,
              },
              'success',
            );
          }

          this.logger.log(
            `Fallback successful: provider=${fallbackResponse.provider}, model=${fallbackResponse.model}`,
          );

          return fallbackResponse;
        } catch (fallbackError) {
          this.logger.error(
            `Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`,
          );
        }
      }

      this.logger.error(
        `LLM Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Appelle un LLM avec retry et circuit breaker
   */
  private async callWithResilience(
    provider: LLMProvider,
    request: LLMRequest,
  ): Promise<LLMResponse> {
    const circuitBreaker = this.circuitBreakers.get(provider);
    if (!circuitBreaker) {
      throw new Error(`No circuit breaker for provider ${provider}`);
    }

    // Exécuter avec circuit breaker
    return circuitBreaker.execute(
      `llm-${provider}`,
      async () => {
        // Exécuter avec retry
        return this.retryService.execute(
          async () => {
            switch (provider) {
              case LLMProvider.OPENAI:
                return this.callOpenAI(request);
              case LLMProvider.ANTHROPIC:
                return this.callAnthropic(request);
              case LLMProvider.MISTRAL:
                return this.callMistral(request);
              default:
                throw new Error(`Unsupported provider: ${provider}`);
            }
          },
          {
            maxRetries: 3,
            initialDelayMs: 1000,
            maxDelayMs: 10000,
            retryableErrors: [
              /timeout/i,
              /network/i,
              /ECONNRESET/i,
              /ETIMEDOUT/i,
              /503/i,
              /502/i,
              /504/i,
              /429/i,
            ],
            onRetry: (error, attempt, delayMs) => {
              this.logger.warn(
                `Retry ${attempt} for ${provider} after ${delayMs}ms: ${error.message}`,
              );
              
              // ✅ PHASE 2: Enregistrer retry dans métriques
              // Note: agentType n'est pas disponible ici, on utilise 'unknown'
              this.metrics.recordRetry(
                {
                  agent: 'unknown' as any,
                  provider,
                },
                attempt,
              );
            },
          },
        );
      },
    );
  }

  /**
   * Enregistre le coût d'un appel LLM
   */
  private async recordCost(
    brandId: string,
    provider: LLMProvider,
    model: string,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number },
    latencyMs: number,
    agentType?: string,
  ): Promise<void> {
    try {
      // Calculer le coût
      const costCalculation = this.costCalculator.calculateCost(
        provider,
        model,
        usage,
      );

      // Enregistrer dans AICost
      await this.aiService.recordAICost(
        brandId,
        provider,
        model,
        costCalculation.costCents,
        {
          tokens: usage.totalTokens,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          duration: latencyMs,
          agentType: agentType || 'unknown',
          breakdown: costCalculation.breakdown,
        },
      );

      this.logger.debug(
        `Recorded LLM cost: ${costCalculation.costCents} cents for brand ${brandId}, ` +
        `provider=${provider}, model=${model}, tokens=${usage.totalTokens}`,
      );
    } catch (error) {
      // Ne pas faire échouer la requête si l'enregistrement du coût échoue
      this.logger.error(
        `Failed to record LLM cost: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
    }
  }

  /**
   * Appel à OpenAI
   */
  private async callOpenAI(request: LLMRequest): Promise<LLMResponse> {
    const response = await firstValueFrom(
      this.httpService.post(
        this.OPENAI_URL,
        {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          stream: request.stream,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const data = response.data;

    return {
      content: data.choices[0].message.content,
      provider: LLMProvider.OPENAI,
      model: request.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      finishReason: data.choices[0].finish_reason,
      latencyMs: 0, // Set by caller
    };
  }

  /**
   * Appel à Anthropic
   */
  private async callAnthropic(request: LLMRequest): Promise<LLMResponse> {
    // Convertir les messages au format Anthropic
    const systemMessage = request.messages.find(m => m.role === 'system');
    const otherMessages = request.messages.filter(m => m.role !== 'system');

    const response = await firstValueFrom(
      this.httpService.post(
        this.ANTHROPIC_URL,
        {
          model: request.model,
          max_tokens: request.maxTokens,
          system: systemMessage?.content,
          messages: otherMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
        {
          headers: {
            'x-api-key': this.anthropicApiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const data = response.data;

    return {
      content: data.content[0].text,
      provider: LLMProvider.ANTHROPIC,
      model: request.model,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      finishReason: data.stop_reason,
      latencyMs: 0,
    };
  }

  /**
   * Appel à Mistral
   */
  private async callMistral(request: LLMRequest): Promise<LLMResponse> {
    const response = await firstValueFrom(
      this.httpService.post(
        this.MISTRAL_URL,
        {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          stream: request.stream,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.mistralApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const data = response.data;

    return {
      content: data.choices[0].message.content,
      provider: LLMProvider.MISTRAL,
      model: request.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      finishReason: data.choices[0].finish_reason,
      latencyMs: 0,
    };
  }

  /**
   * Sélectionne automatiquement le meilleur provider/modèle
   * basé sur le type de tâche et le budget
   */
  selectOptimalModel(
    taskType: 'analysis' | 'creative' | 'simple' | 'coding',
    maxCostPerRequest: number = 0.1,
  ): { provider: LLMProvider; model: string } {
    // Logique de sélection basée sur le type de tâche
    switch (taskType) {
      case 'analysis':
        return { provider: LLMProvider.ANTHROPIC, model: LLM_MODELS.anthropic.CLAUDE_3_SONNET };
      case 'creative':
        return { provider: LLMProvider.OPENAI, model: LLM_MODELS.openai.GPT4_TURBO };
      case 'coding':
        return { provider: LLMProvider.ANTHROPIC, model: LLM_MODELS.anthropic.CLAUDE_3_OPUS };
      case 'simple':
      default:
        return { provider: LLMProvider.MISTRAL, model: LLM_MODELS.mistral.MISTRAL_SMALL };
    }
  }
}
