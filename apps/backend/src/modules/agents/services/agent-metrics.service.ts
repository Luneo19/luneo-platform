/**
 * @fileoverview Service de métriques Prometheus pour les Agents IA
 * @module AgentMetricsService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Métriques Prometheus standardisées
 * - ✅ Labels pour filtrage (agent, provider, model, brandId)
 * - ✅ Types explicites
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrometheusService } from '@/libs/metrics/prometheus.service';

// ============================================================================
// TYPES
// ============================================================================

export type AgentType = 'luna' | 'aria' | 'nova';
export interface AgentMetricsLabels {
  agent: AgentType;
  provider?: string;
  model?: string;
  brandId?: string;
  intent?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class AgentMetricsService implements OnModuleInit {
  private readonly logger = new Logger(AgentMetricsService.name);

  // Métriques Prometheus (prom-client types: Histogram, Counter, Gauge)
  private requestDuration: { observe: (labels: Record<string, string>, value: number) => void };
  private requestTotal: { inc: (labels: Record<string, string>) => void };
  private tokensTotal: { inc: (labels: Record<string, string>, value: number) => void };
  private costTotal: { inc: (labels: Record<string, string>, value: number) => void };
  private errorsTotal: { inc: (labels: Record<string, string>) => void };
  private retriesTotal: { inc: (labels: Record<string, string>) => void };
  private circuitBreakerState: { set: (labels: Record<string, string>, value: number) => void };
  private cacheHits: { inc: (labels: Record<string, string>) => void };
  private cacheMisses: { inc: (labels: Record<string, string>) => void };

  constructor(private readonly prometheus: PrometheusService) {
    // Initialiser les métriques si prom-client est disponible
    const registry = (prometheus as unknown as { registry?: unknown }).registry;
    if (registry) {
      this.initializeMetrics(registry);
    } else {
      // Fallback: créer des objets vides
      this.requestDuration = { observe: () => {} };
      this.requestTotal = { inc: () => {} };
      this.tokensTotal = { inc: () => {} };
      this.costTotal = { inc: () => {} };
      this.errorsTotal = { inc: () => {} };
      this.retriesTotal = { inc: () => {} };
      this.circuitBreakerState = { set: () => {} };
      this.cacheHits = { inc: () => {} };
      this.cacheMisses = { inc: () => {} };
      this.logger.warn('Prometheus not available, metrics will be disabled');
    }
  }

  onModuleInit() {
    const registry = (this.prometheus as unknown as { registry?: unknown }).registry;
    if (registry) {
      this.logger.log('Agent metrics service initialized');
    }
  }

  /**
   * Initialise les métriques Prometheus pour les agents
   */
  private initializeMetrics(registry: unknown): void {
    const { Registry, Histogram, Counter, Gauge } = require('prom-client');

    // Durée des requêtes agents (Histogram)
    this.requestDuration = new Histogram({
      name: 'agent_request_duration_seconds',
      help: 'Duration of agent requests in seconds',
      labelNames: ['agent', 'provider', 'model', 'intent', 'brandId'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [registry],
    });

    // Total des requêtes agents (Counter)
    this.requestTotal = new Counter({
      name: 'agent_requests_total',
      help: 'Total number of agent requests',
      labelNames: ['agent', 'provider', 'model', 'status', 'brandId'],
      registers: [registry],
    });

    // Total des tokens utilisés (Counter)
    this.tokensTotal = new Counter({
      name: 'agent_tokens_total',
      help: 'Total tokens used by agents',
      labelNames: ['agent', 'provider', 'model', 'type', 'brandId'],
      registers: [registry],
    });

    // Total des coûts (Counter, en centimes)
    this.costTotal = new Counter({
      name: 'agent_cost_total',
      help: 'Total cost in cents for agent requests',
      labelNames: ['agent', 'provider', 'model', 'brandId'],
      registers: [registry],
    });

    // Total des erreurs (Counter)
    this.errorsTotal = new Counter({
      name: 'agent_errors_total',
      help: 'Total number of agent errors',
      labelNames: ['agent', 'provider', 'model', 'error_type', 'brandId'],
      registers: [registry],
    });

    // Total des retries (Counter)
    this.retriesTotal = new Counter({
      name: 'agent_retries_total',
      help: 'Total number of retries',
      labelNames: ['agent', 'provider', 'attempt', 'brandId'],
      registers: [registry],
    });

    // État du circuit breaker (Gauge: 0=CLOSED, 1=OPEN, 2=HALF_OPEN)
    this.circuitBreakerState = new Gauge({
      name: 'agent_circuit_breaker_state',
      help: 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
      labelNames: ['provider'],
      registers: [registry],
    });

    // Cache hits/misses
    this.cacheHits = new Counter({
      name: 'agent_cache_hits_total',
      help: 'Total cache hits',
      labelNames: ['agent', 'cache_type'],
      registers: [registry],
    });

    this.cacheMisses = new Counter({
      name: 'agent_cache_misses_total',
      help: 'Total cache misses',
      labelNames: ['agent', 'cache_type'],
      registers: [registry],
    });
  }

  /**
   * Enregistre la durée d'une requête agent
   */
  recordRequestDuration(
    labels: AgentMetricsLabels,
    durationSeconds: number,
  ): void {
    this.requestDuration.observe(
      {
        agent: labels.agent,
        provider: labels.provider || 'unknown',
        model: labels.model || 'unknown',
        intent: labels.intent || 'unknown',
        brandId: labels.brandId || 'unknown',
      },
      durationSeconds,
    );
  }

  /**
   * Incrémente le compteur de requêtes
   */
  recordRequest(
    labels: AgentMetricsLabels,
    status: 'success' | 'error' | 'timeout',
  ): void {
    this.requestTotal.inc({
      agent: labels.agent,
      provider: labels.provider || 'unknown',
      model: labels.model || 'unknown',
      status,
      brandId: labels.brandId || 'unknown',
    });
  }

  /**
   * Enregistre l'utilisation de tokens
   */
  recordTokens(
    labels: AgentMetricsLabels,
    tokens: number,
    type: 'prompt' | 'completion' | 'total',
  ): void {
    this.tokensTotal.inc(
      {
        agent: labels.agent,
        provider: labels.provider || 'unknown',
        model: labels.model || 'unknown',
        type,
        brandId: labels.brandId || 'unknown',
      },
      tokens,
    );
  }

  /**
   * Enregistre un coût
   */
  recordCost(
    labels: AgentMetricsLabels,
    costCents: number,
  ): void {
    this.costTotal.inc(
      {
        agent: labels.agent,
        provider: labels.provider || 'unknown',
        model: labels.model || 'unknown',
        brandId: labels.brandId || 'unknown',
      },
      costCents,
    );
  }

  /**
   * Enregistre une erreur
   */
  recordError(
    labels: AgentMetricsLabels,
    errorType: string,
  ): void {
    this.errorsTotal.inc({
      agent: labels.agent,
      provider: labels.provider || 'unknown',
      model: labels.model || 'unknown',
      error_type: errorType,
      brandId: labels.brandId || 'unknown',
    });
  }

  /**
   * Enregistre un retry
   */
  recordRetry(
    labels: AgentMetricsLabels,
    attempt: number,
  ): void {
    this.retriesTotal.inc({
      agent: labels.agent,
      provider: labels.provider || 'unknown',
      attempt: attempt.toString(),
      brandId: labels.brandId || 'unknown',
    });
  }

  /**
   * Met à jour l'état du circuit breaker
   */
  updateCircuitBreakerState(
    provider: string,
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN',
  ): void {
    const stateValue = state === 'CLOSED' ? 0 : state === 'OPEN' ? 1 : 2;
    this.circuitBreakerState.set({ provider }, stateValue);
  }

  /**
   * Enregistre un cache hit
   */
  recordCacheHit(agent: AgentType, cacheType: string = 'default'): void {
    this.cacheHits.inc({ agent, cache_type: cacheType });
  }

  /**
   * Enregistre un cache miss
   */
  recordCacheMiss(agent: AgentType, cacheType: string = 'default'): void {
    this.cacheMisses.inc({ agent, cache_type: cacheType });
  }
}
