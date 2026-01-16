/**
 * @fileoverview Service orchestrateur pour gérer les interactions entre agents
 * @module AgentOrchestratorService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation robuste
 * - ✅ Gestion d'erreurs
 * - ✅ Gardes pour éviter les crashes
 */

import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IntentDetectionService } from './intent-detection.service';

// ============================================================================
// TYPES STRICTS
// ============================================================================

/**
 * Type d'agent disponible
 */
export type AgentType = 'luna' | 'aria' | 'nova';

/**
 * Type d'agent avec auto-routing
 */
export type AgentTypeWithAuto = AgentType | 'auto';

/**
 * Contexte pour le routage d'agent
 */
export interface AgentRoutingContext {
  message?: string;
  currentPage?: string;
  selectedProductId?: string;
  productId?: string;
  userId?: string;
  brandId?: string;
  [key: string]: unknown;
}

/**
 * Résultat du routage avec confiance
 */
export interface AgentRoutingResult {
  agent: AgentType;
  confidence: number;
  reasons: string[];
}

/**
 * Scores de routage par agent
 */
interface AgentScores {
  luna: number;
  aria: number;
  nova: number;
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Plan d'exécution pour requêtes complexes
 */
interface ExecutionPlan {
  steps: Array<{
    agent: AgentType;
    action: string;
    dependsOn?: number; // Index de l'étape précédente
  }>;
  complexity: 'simple' | 'complex';
  estimatedLatency: number; // ms
}

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Détermine quel agent doit traiter une requête avec validation robuste
   */
  routeToAgent(
    agentType: AgentTypeWithAuto,
    context: AgentRoutingContext,
  ): AgentType {
    // ✅ Validation des entrées
    if (!context || typeof context !== 'object') {
      this.logger.warn('Invalid context provided to routeToAgent, defaulting to nova');
      return 'nova';
    }

    // ✅ Si l'agent est explicitement spécifié (pas 'auto'), le retourner directement
    if (agentType !== 'auto' && this.isValidAgentType(agentType)) {
      return agentType;
    }

    // ✅ Routage intelligent basé sur le contexte (synchrone pour compatibilité)
    // Note: routeWithContext est maintenant async, mais on garde routeToAgent synchrone
    // pour compatibilité. Utiliser routeWithContextAsync pour la version async complète.
    const result = this.routeWithContextSync(context);
    this.logger.debug(
      `Agent routing result: ${result.agent} (confidence: ${result.confidence})`,
    );

    return result.agent;
  }

  /**
   * Version synchrone pour compatibilité (sans IntentDetectionService)
   * Utilisée par routeToAgent pour rester synchrone
   */
  private routeWithContextSync(context: AgentRoutingContext): AgentRoutingResult {
    const normalizedContext = this.normalizeContext(context);
    const { message, currentPage, hasProductContext } = normalizedContext;

    const scores: AgentScores = {
      luna: 0,
      aria: 0,
      nova: 0,
    };
    const reasons: string[] = [];

    this.calculatePatternScores(message, scores, reasons);
    this.calculateContextScores(currentPage, hasProductContext, scores, reasons);

    return this.selectBestAgent(scores, reasons);
  }

  /**
   * Implémentation async avec IntentDetectionService
   */
  private async routeWithContextAsyncImpl(context: AgentRoutingContext): Promise<AgentRoutingResult> {
    // ✅ Validation et normalisation du contexte
    const normalizedContext = this.normalizeContext(context);
    const { message, currentPage, hasProductContext } = normalizedContext;

    // ✅ Initialisation des scores
    const scores: AgentScores = {
      luna: 0,
      aria: 0,
      nova: 0,
    };
    const reasons: string[] = [];

    // ✅ PHASE 1: Calcul heuristique (patterns + contexte)
    this.calculatePatternScores(message, scores, reasons);
    this.calculateContextScores(currentPage, hasProductContext, scores, reasons);

    // ✅ PHASE 2: Utiliser IntentDetectionService pour classification précise
    if (message && message.trim().length > 0) {
      try {
        const intentService = this.moduleRef.get(IntentDetectionService, { strict: false });
        if (intentService) {
          const possibleIntents: AgentType[] = ['luna', 'aria', 'nova'];
          const intentResult = await intentService.detectIntent(
            message,
            'nova', // Agent par défaut pour détection
            possibleIntents,
            typeof context.brandId === 'string' ? context.brandId : undefined,
          );

          // ✅ Ajouter score basé sur la détection LLM
          if (intentResult && intentResult.intent && this.isValidAgentType(intentResult.intent)) {
            const llmScore = Math.round(intentResult.confidence * 3); // Multiplier par 3 pour poids LLM
            scores[intentResult.intent] += llmScore;
            reasons.push(
              `${intentResult.intent}: LLM detection (confidence: ${intentResult.confidence})`,
            );
          }
        }
      } catch (error) {
        this.logger.warn(
          `Intent detection failed in orchestrator: ${error instanceof Error ? error.message : 'Unknown'}`,
        );
      }
    }

    // ✅ Déterminer le meilleur agent avec validation
    return this.selectBestAgent(scores, reasons);
  }

  /**
   * Version publique synchrone (pour compatibilité)
   * Utilise routeWithContextSync en interne
   */
  routeWithContext(context: AgentRoutingContext): AgentRoutingResult {
    return this.routeWithContextSync(context);
  }

  /**
   * Version async avec IntentDetectionService (recommandée pour nouveaux usages)
   * Conforme au plan PHASE 1 - C) - Classifieur avec IntentDetectionService
   */
  async routeWithContextAsync(context: AgentRoutingContext): Promise<AgentRoutingResult> {
    return this.routeWithContextAsyncImpl(context);
  }

  /**
   * Génère un plan d'exécution pour requêtes complexes
   * Conforme au plan PHASE 1 - C) - Support "simple → direct" et "complex → multi-steps"
   */
  generateExecutionPlan(
    context: AgentRoutingContext,
    routingResult: AgentRoutingResult,
  ): ExecutionPlan {
    const { message, currentPage } = this.normalizeContext(context);
    const complexity = this.determineComplexity(message, routingResult);

    // ✅ Requête simple → direct
    if (complexity === 'simple') {
      return {
        steps: [
          {
            agent: routingResult.agent,
            action: 'direct_response',
          },
        ],
        complexity: 'simple',
        estimatedLatency: 1000, // 1s pour réponse directe
      };
    }

    // ✅ Requête complexe → multi-steps
    const steps: ExecutionPlan['steps'] = [];

    // Exemple: Analyse + Recommandation
    if (routingResult.agent === 'luna' && message.includes('recommand')) {
      steps.push(
        {
          agent: 'luna',
          action: 'analyze_data',
        },
        {
          agent: 'luna',
          action: 'generate_recommendations',
          dependsOn: 0,
        },
      );
    }
    // Exemple: Support technique + Création ticket
    else if (routingResult.agent === 'nova' && message.includes('bug')) {
      steps.push(
        {
          agent: 'nova',
          action: 'search_faq',
        },
        {
          agent: 'nova',
          action: 'create_ticket',
          dependsOn: 0,
        },
      );
    }
    // Exemple: Personnalisation + Suggestions
    else if (routingResult.agent === 'aria' && message.includes('suggère')) {
      steps.push(
        {
          agent: 'aria',
          action: 'analyze_context',
        },
        {
          agent: 'aria',
          action: 'generate_suggestions',
          dependsOn: 0,
        },
      );
    }
    // Fallback: étape unique
    else {
      steps.push({
        agent: routingResult.agent,
        action: 'process_request',
      });
    }

    return {
      steps,
      complexity: 'complex',
      estimatedLatency: steps.length * 2000, // 2s par étape
    };
  }

  /**
   * Détermine la complexité d'une requête
   */
  private determineComplexity(message: string, routingResult: AgentRoutingResult): 'simple' | 'complex' {
    // ✅ Requêtes complexes: contiennent plusieurs intentions ou faible confiance
    if (routingResult.confidence < 0.6) {
      return 'complex';
    }

    // ✅ Mots-clés indiquant complexité
    const complexKeywords = [
      'et',
      'puis',
      'ensuite',
      'aussi',
      'combiner',
      'analyser',
      'recommand',
      'créer',
      'générer',
    ];

    const hasComplexKeywords = complexKeywords.some((keyword) => message.includes(keyword));

    // ✅ Longueur du message (messages longs = plus complexes)
    const isLongMessage = message.split(' ').length > 15;

    return hasComplexKeywords || isLongMessage ? 'complex' : 'simple';
  }

  /**
   * Normalise le contexte avec gardes
   */
  private normalizeContext(context: AgentRoutingContext): {
    message: string;
    currentPage: string;
    hasProductContext: boolean;
  } {
    return {
      message: typeof context.message === 'string' && context.message.trim().length > 0
        ? context.message.trim().toLowerCase()
        : '',
      currentPage: typeof context.currentPage === 'string' && context.currentPage.trim().length > 0
        ? context.currentPage.trim().toLowerCase()
        : '',
      hasProductContext: Boolean(
        (typeof context.selectedProductId === 'string' && context.selectedProductId.trim().length > 0) ||
        (typeof context.productId === 'string' && context.productId.trim().length > 0),
      ),
    };
  }

  /**
   * Calcule les scores basés sur les patterns de mots-clés
   */
  private calculatePatternScores(
    message: string,
    scores: AgentScores,
    reasons: string[],
  ): void {
    // ✅ Patterns Luna (B2B BI)
    const lunaPatterns = [
      /\b(vente|chiffre|revenue|analytics|rapport|statistique|kpi|conversion)\b/i,
      /\b(prédiction|tendance|forecast|prévision)\b/i,
      /\b(recommand|suggère|optimis|améliore)\b/i,
      /\b(configur|créer produit|nouveau produit)\b/i,
    ];

    // ✅ Patterns Aria (B2C Créatif)
    const ariaPatterns = [
      /\b(texte|message|inscription|gravure)\b/i,
      /\b(idée|suggère|propose|inspiration)\b/i,
      /\b(anniversaire|mariage|naissance|cadeau)\b/i,
      /\b(police|font|couleur|style)\b/i,
      /\b(tradui|améliore|embellis)\b/i,
    ];

    // ✅ Patterns Nova (Support)
    const novaPatterns = [
      /\b(aide|help|problème|bug|erreur)\b/i,
      /\b(comment|tutoriel|guide|expliqu)\b/i,
      /\b(facture|abonnement|paiement|prix)\b/i,
      /\b(intégration|shopify|api|webhook)\b/i,
      /\b(ticket|support humain)\b/i,
    ];

    this.addPatternScore('luna', lunaPatterns, message, scores, reasons);
    this.addPatternScore('aria', ariaPatterns, message, scores, reasons);
    this.addPatternScore('nova', novaPatterns, message, scores, reasons);
  }

  /**
   * Ajoute un score basé sur les patterns pour un agent
   */
  private addPatternScore(
    agent: AgentType,
    patterns: RegExp[],
    message: string,
    scores: AgentScores,
    reasons: string[],
  ): void {
    if (!message || message.trim().length === 0) {
      return;
    }

    const matches = patterns.filter((pattern) => {
      try {
        return pattern.test(message);
      } catch (error) {
        this.logger.warn(`Pattern test failed: ${error instanceof Error ? error.message : 'Unknown'}`);
        return false;
      }
    }).length;

    if (matches > 0) {
      scores[agent] += matches;
      reasons.push(`${agent}: ${matches} keyword matches`);
    }
  }

  /**
   * Calcule les scores basés sur le contexte de page
   */
  private calculateContextScores(
    currentPage: string,
    hasProductContext: boolean,
    scores: AgentScores,
    reasons: string[],
  ): void {
    // ✅ Contexte dashboard/analytics → Luna
    if (currentPage.includes('analytics') || currentPage.includes('dashboard')) {
      scores.luna += 2;
      reasons.push('luna: dashboard/analytics context');
    }

    // ✅ Contexte widget/produit → Aria
    if (currentPage.includes('widget') || hasProductContext) {
      scores.aria += 2;
      reasons.push('aria: widget/product context');
    }

    // ✅ Contexte support/help → Nova
    if (currentPage.includes('support') || currentPage.includes('help')) {
      scores.nova += 2;
      reasons.push('nova: support/help context');
    }
  }

  /**
   * Sélectionne le meilleur agent avec validation
   */
  private selectBestAgent(scores: AgentScores, reasons: string[]): AgentRoutingResult {
    // ✅ Trier les agents par score décroissant
    const sorted = Object.entries(scores).sort((a, b) => {
      const scoreA = typeof a[1] === 'number' ? a[1] : 0;
      const scoreB = typeof b[1] === 'number' ? b[1] : 0;
      return scoreB - scoreA;
    }) as Array<[AgentType, number]>;

    // ✅ Garde pour éviter les crashes
    if (sorted.length === 0) {
      this.logger.warn('No agents found in scores, defaulting to nova');
      return {
        agent: 'nova',
        confidence: 0.34,
        reasons: ['nova: default fallback'],
      };
    }

    const [topAgent, topScore] = sorted[0];
    const totalScore = Object.values(scores).reduce((sum, val) => {
      const numVal = typeof val === 'number' ? val : 0;
      return sum + numVal;
    }, 0);

    // ✅ Calcul de la confiance avec garde
    const confidence = totalScore > 0
      ? Math.min(1, Math.max(0, topScore / totalScore))
      : 0.34;

    // ✅ Sélection de l'agent avec fallback
    const selectedAgent = topScore > 0 && this.isValidAgentType(topAgent)
      ? topAgent
      : 'nova';

    return {
      agent: selectedAgent,
      confidence: Math.round(confidence * 100) / 100,
      reasons: reasons.length > 0 ? reasons : [`${selectedAgent}: default selection`],
    };
  }

  /**
   * Valide si un type d'agent est valide
   */
  private isValidAgentType(agent: string): agent is AgentType {
    return agent === 'luna' || agent === 'aria' || agent === 'nova';
  }
}
