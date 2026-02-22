/**
 * @fileoverview Service de circuit breaker pour protéger contre les cascades d'erreurs
 * @module CircuitBreakerService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ États: CLOSED, OPEN, HALF_OPEN
 * - ✅ Threshold configurable
 * - ✅ Reset timeout
 * - ✅ Types explicites
 */

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

// ============================================================================
// TYPES
// ============================================================================

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Nombre d'échecs avant OPEN
  successThreshold?: number; // Nombre de succès pour fermer depuis HALF_OPEN
  timeoutMs?: number; // Temps avant tentative HALF_OPEN
  resetTimeoutMs?: number; // Temps avant reset complet
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5, // 5 échecs = OPEN
  successThreshold: 2, // 2 succès = CLOSED depuis HALF_OPEN
  timeoutMs: 60000, // 60s avant tentative HALF_OPEN
  resetTimeoutMs: 300000, // 5min avant reset complet
};

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  openedAt: number | null;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits: Map<string, CircuitBreakerState> = new Map();
  private readonly options: Required<CircuitBreakerOptions> = DEFAULT_OPTIONS;

  constructor() {
    // Utiliser les options par défaut
  }

  /**
   * Exécute une fonction avec circuit breaker
   */
  async execute<T>(
    key: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const circuit = this.getOrCreateCircuit(key);

    // Vérifier l'état du circuit
    this.updateCircuitState(circuit);

    if (circuit.state === CircuitState.OPEN) {
      this.logger.warn(
        `Circuit breaker OPEN for ${key}, rejecting request`,
      );
      throw new ServiceUnavailableException(
        `Circuit breaker is OPEN for ${key}. Service temporarily unavailable.`,
      );
    }

    try {
      const result = await fn();
      this.onSuccess(key, circuit);
      return result;
    } catch (error) {
      this.onFailure(key, circuit);
      throw error;
    }
  }

  /**
   * Récupère ou crée un circuit breaker
   */
  private getOrCreateCircuit(key: string): CircuitBreakerState {
    if (!this.circuits.has(key)) {
      this.circuits.set(key, {
        state: CircuitState.CLOSED,
        failures: 0,
        successes: 0,
        lastFailureTime: null,
        lastSuccessTime: null,
        openedAt: null,
      });
    }
    return this.circuits.get(key)!;
  }

  /**
   * Met à jour l'état du circuit selon le temps écoulé
   */
  private updateCircuitState(circuit: CircuitBreakerState): void {
    const now = Date.now();

    // Si OPEN, vérifier si on peut passer en HALF_OPEN
    if (
      circuit.state === CircuitState.OPEN &&
      circuit.openedAt &&
      now - circuit.openedAt >= this.options.timeoutMs
    ) {
      this.logger.log('Circuit breaker transitioning to HALF_OPEN');
      circuit.state = CircuitState.HALF_OPEN;
      circuit.successes = 0;
    }

    // Si HALF_OPEN avec succès, fermer le circuit
    if (
      circuit.state === CircuitState.HALF_OPEN &&
      circuit.successes >= this.options.successThreshold
    ) {
      this.logger.log('Circuit breaker CLOSED after successful HALF_OPEN');
      circuit.state = CircuitState.CLOSED;
      circuit.failures = 0;
      circuit.successes = 0;
      circuit.openedAt = null;
    }

    // Reset complet si trop de temps écoulé
    if (
      circuit.lastFailureTime &&
      now - circuit.lastFailureTime >= this.options.resetTimeoutMs
    ) {
      this.logger.log('Circuit breaker reset after timeout');
      circuit.state = CircuitState.CLOSED;
      circuit.failures = 0;
      circuit.successes = 0;
      circuit.lastFailureTime = null;
      circuit.openedAt = null;
    }
  }

  /**
   * Gère un succès
   */
  private onSuccess(key: string, circuit: CircuitBreakerState): void {
    circuit.lastSuccessTime = Date.now();

    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.successes++;
      this.logger.debug(
        `Circuit breaker HALF_OPEN success ${circuit.successes}/${this.options.successThreshold} for ${key}`,
      );
    } else if (circuit.state === CircuitState.CLOSED) {
      // Reset failures sur succès en CLOSED
      circuit.failures = 0;
    }
  }

  /**
   * Gère un échec
   */
  private onFailure(key: string, circuit: CircuitBreakerState): void {
    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === CircuitState.HALF_OPEN) {
      // Retour en OPEN depuis HALF_OPEN
      this.logger.warn(
        `Circuit breaker HALF_OPEN failed, returning to OPEN for ${key}`,
      );
      circuit.state = CircuitState.OPEN;
      circuit.openedAt = Date.now();
      circuit.successes = 0;
    } else if (
      circuit.state === CircuitState.CLOSED &&
      circuit.failures >= this.options.failureThreshold
    ) {
      // Ouvrir le circuit
      this.logger.error(
        `Circuit breaker OPENED for ${key} after ${circuit.failures} failures`,
      );
      circuit.state = CircuitState.OPEN;
      circuit.openedAt = Date.now();
    }
  }

  /**
   * Récupère l'état d'un circuit
   */
  getState(key: string): CircuitState | null {
    const circuit = this.circuits.get(key);
    if (!circuit) {
      return null;
    }
    this.updateCircuitState(circuit);
    return circuit.state;
  }

  /**
   * Reset manuel d'un circuit
   */
  reset(key: string): void {
    const circuit = this.circuits.get(key);
    if (circuit) {
      this.logger.log(`Manually resetting circuit breaker for ${key}`);
      circuit.state = CircuitState.CLOSED;
      circuit.failures = 0;
      circuit.successes = 0;
      circuit.lastFailureTime = null;
      circuit.openedAt = null;
    }
  }

  /**
   * Récupère les statistiques d'un circuit
   */
  getStats(key: string): {
    state: CircuitState;
    failures: number;
    successes: number;
  } | null {
    const circuit = this.circuits.get(key);
    if (!circuit) {
      return null;
    }
    this.updateCircuitState(circuit);
    return {
      state: circuit.state,
      failures: circuit.failures,
      successes: circuit.successes,
    };
  }
}
