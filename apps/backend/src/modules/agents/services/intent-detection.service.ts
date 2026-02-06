/**
 * @fileoverview Service de détection d'intention améliorée avec LLM
 * @module IntentDetectionService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Utilise LLM pour classification (plus précis que mots-clés)
 * - ✅ Confidence score réel
 * - ✅ Cache pour performance
 * - ✅ Types explicites
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { LLMRouterService, LLMProvider, LLM_MODELS, Message } from './llm-router.service';
import { AgentMetricsService } from './agent-metrics.service';

// ============================================================================
// TYPES
// ============================================================================

export interface IntentDetectionResult {
  intent: string;
  confidence: number; // 0-1
  reasoning?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class IntentDetectionService {
  private readonly logger = new Logger(IntentDetectionService.name);

  constructor(
    private readonly llmRouter: LLMRouterService,
    private readonly cache: SmartCacheService,
    private readonly metrics: AgentMetricsService,
  ) {}

  /**
   * Détecte l'intention d'un message avec LLM (plus précis que mots-clés)
   */
  async detectIntent(
    message: string,
    agentType: 'luna' | 'aria' | 'nova',
    possibleIntents: string[],
    brandId?: string,
  ): Promise<IntentDetectionResult> {
    // Générer clé de cache
    const cacheKey = `intent:${agentType}:${this.hashMessage(message)}:${possibleIntents.join(',')}`;

    // ✅ Vérifier le cache avec typage strict
    const cached = await this.cache.getSimple<IntentDetectionResult>(cacheKey);
    if (cached && typeof cached === 'object' && 'intent' in cached && 'confidence' in cached) {
      this.metrics.recordCacheHit(agentType, 'intent');
      return cached;
    }

    this.metrics.recordCacheMiss(agentType, 'intent');

    try {
      // Construire le prompt de classification
      const systemPrompt = this.buildClassificationPrompt(agentType, possibleIntents);
      
      const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Message utilisateur: "${message}"\n\nClassifie l'intention et réponds en JSON: { "intent": "...", "confidence": 0.0-1.0, "reasoning": "..." }` 
        },
      ];

      // Utiliser Claude Haiku (rapide + pas cher) pour classification
      const startTime = Date.now();
      const response = await this.llmRouter.chat({
        provider: LLMProvider.ANTHROPIC,
        model: LLM_MODELS.anthropic.CLAUDE_3_HAIKU,
        messages,
        temperature: 0.3, // Basse température pour classification précise
        maxTokens: 200, // Réponse courte suffit
        brandId,
        agentType,
        enableFallback: true,
      });

      const durationMs = Date.now() - startTime;
      this.logger.debug(
        `Intent detection completed in ${durationMs}ms for agent ${agentType}`,
      );

      // Parser la réponse JSON
      const result = this.parseIntentResponse(response.content, possibleIntents);

      // ✅ Mettre en cache (TTL: 1 heure)
      await this.cache.setSimple(cacheKey, result, 3600);

      return result;
    } catch (error) {
      this.logger.error(
        `Intent detection failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      
      // Fallback vers détection basique
      return this.fallbackDetection(message, possibleIntents);
    }
  }

  /**
   * Construit le prompt de classification selon l'agent
   */
  private buildClassificationPrompt(
    agentType: 'luna' | 'aria' | 'nova',
    possibleIntents: string[],
  ): string {
    const agentContext = {
      luna: 'agent B2B pour analyses de données, génération de rapports, et gestion produits',
      aria: 'agent B2C pour suggestions de textes, amélioration de style, et personnalisation',
      nova: 'agent Support pour FAQ, résolution de problèmes, et création de tickets',
    };

    return `Tu es un expert en classification d'intentions pour ${agentContext[agentType]}.

Intentions possibles:
${possibleIntents.map((intent, i) => `${i + 1}. ${intent}`).join('\n')}

Ta tâche:
1. Analyser le message utilisateur
2. Identifier l'intention la plus probable parmi la liste
3. Donner un score de confiance (0.0-1.0)
4. Expliquer brièvement ton raisonnement

Réponds UNIQUEMENT en JSON valide:
{
  "intent": "nom_de_l_intention",
  "confidence": 0.95,
  "reasoning": "explication courte"
}`;
  }

  /**
   * Parse la réponse LLM en IntentDetectionResult
   */
  private parseIntentResponse(
    content: string,
    possibleIntents: string[],
  ): IntentDetectionResult {
    try {
      // Extraire JSON de la réponse (peut contenir markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new BadRequestException('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Valider l'intention
      const intent = parsed.intent || possibleIntents[0];
      if (!possibleIntents.includes(intent)) {
        this.logger.warn(
          `Intent "${intent}" not in possible intents, using first option`,
        );
        return {
          intent: possibleIntents[0],
          confidence: 0.5,
          reasoning: 'Fallback: intent not recognized',
        };
      }

      // Valider confidence
      const confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));

      return {
        intent,
        confidence,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      this.logger.error(
        `Failed to parse intent response: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return {
        intent: possibleIntents[0],
        confidence: 0.5,
        reasoning: 'Fallback: parsing error',
      };
    }
  }

  /**
   * Fallback: détection basique par mots-clés
   */
  private fallbackDetection(
    message: string,
    possibleIntents: string[],
  ): IntentDetectionResult {
    const lowerMessage = message.toLowerCase();

    // Chercher des mots-clés simples
    for (const intent of possibleIntents) {
      const keywords = intent.toLowerCase().split('_');
      const matches = keywords.filter((keyword) => lowerMessage.includes(keyword));
      
      if (matches.length > 0) {
        return {
          intent,
          confidence: 0.6, // Confiance moyenne pour fallback
          reasoning: `Fallback: matched keywords ${matches.join(', ')}`,
        };
      }
    }

    // Par défaut: première intention
    return {
      intent: possibleIntents[0],
      confidence: 0.3,
      reasoning: 'Fallback: no keywords matched',
    };
  }

  /**
   * Hash simple d'un message pour cache key
   */
  private hashMessage(message: string): string {
    // Hash simple (pas besoin de crypto pour cache key)
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
