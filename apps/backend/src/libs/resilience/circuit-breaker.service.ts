import { Injectable, Logger } from '@nestjs/common';

/**
 * États du Circuit Breaker
 */
enum CircuitState {
  CLOSED = 'CLOSED',     // Fonctionnement normal
  OPEN = 'OPEN',         // Circuit ouvert, rejette les appels
  HALF_OPEN = 'HALF_OPEN', // Test de récupération
}

export interface CircuitConfig {
  failureThreshold: number;  // Nombre d'échecs avant ouverture
  recoveryTimeout: number;   // Temps avant test de récupération (ms)
  monitoringWindow: number;  // Fenêtre de monitoring (ms)
  halfOpenMaxCalls: number;  // Appels max en half-open
}

export interface CircuitStatus {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  openedAt: Date | null;
}

/**
 * Service de Circuit Breaker pour la résilience des services externes
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuits: Map<string, CircuitStatus> = new Map();
  private configs: Map<string, CircuitConfig> = new Map();

  private readonly defaultConfig: CircuitConfig = {
    failureThreshold: 5,
    recoveryTimeout: 30000,  // 30 secondes
    monitoringWindow: 60000, // 1 minute
    halfOpenMaxCalls: 3,
  };

  /**
   * Configure un circuit pour un service
   */
  configure(serviceName: string, config: Partial<CircuitConfig>): void {
    this.configs.set(serviceName, { ...this.defaultConfig, ...config });
    this.initCircuit(serviceName);
    this.logger.log(`Circuit configured for ${serviceName}`, config);
  }

  private initCircuit(serviceName: string): void {
    if (!this.circuits.has(serviceName)) {
      this.circuits.set(serviceName, {
        state: CircuitState.CLOSED,
        failures: 0,
        successes: 0,
        lastFailure: null,
        lastSuccess: null,
        openedAt: null,
      });
    }
  }

  private getConfig(serviceName: string): CircuitConfig {
    return this.configs.get(serviceName) || this.defaultConfig;
  }

  private getCircuit(serviceName: string): CircuitStatus {
    this.initCircuit(serviceName);
    return this.circuits.get(serviceName)!;
  }

  /**
   * Vérifie si un appel peut être effectué
   */
  canCall(serviceName: string): boolean {
    const circuit = this.getCircuit(serviceName);
    const config = this.getConfig(serviceName);

    switch (circuit.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // Vérifier si le temps de récupération est écoulé
        if (circuit.openedAt) {
          const elapsed = Date.now() - circuit.openedAt.getTime();
          if (elapsed >= config.recoveryTimeout) {
            // Passer en half-open pour tester
            this.transitionTo(serviceName, CircuitState.HALF_OPEN);
            return true;
          }
        }
        return false;

      case CircuitState.HALF_OPEN:
        // Permettre quelques appels pour tester
        return circuit.successes < config.halfOpenMaxCalls;

      default:
        return true;
    }
  }

  /**
   * Enregistre un succès
   */
  recordSuccess(serviceName: string): void {
    const circuit = this.getCircuit(serviceName);
    const config = this.getConfig(serviceName);

    circuit.successes++;
    circuit.lastSuccess = new Date();

    if (circuit.state === CircuitState.HALF_OPEN) {
      if (circuit.successes >= config.halfOpenMaxCalls) {
        // Récupération réussie, fermer le circuit
        this.transitionTo(serviceName, CircuitState.CLOSED);
        this.logger.log(`Circuit ${serviceName} recovered and closed`);
      }
    } else if (circuit.state === CircuitState.CLOSED) {
      // Reset des échecs après un succès en état fermé
      this.resetFailures(serviceName);
    }
  }

  /**
   * Enregistre un échec
   */
  recordFailure(serviceName: string, error?: Error): void {
    const circuit = this.getCircuit(serviceName);
    const config = this.getConfig(serviceName);

    circuit.failures++;
    circuit.lastFailure = new Date();

    this.logger.warn(`Circuit ${serviceName} failure recorded`, {
      failures: circuit.failures,
      threshold: config.failureThreshold,
      error: error?.message,
    });

    if (circuit.state === CircuitState.HALF_OPEN) {
      // Un échec en half-open rouvre immédiatement le circuit
      this.transitionTo(serviceName, CircuitState.OPEN);
      this.logger.warn(`Circuit ${serviceName} reopened due to failure in half-open state`);
    } else if (circuit.state === CircuitState.CLOSED && circuit.failures >= config.failureThreshold) {
      // Seuil atteint, ouvrir le circuit
      this.transitionTo(serviceName, CircuitState.OPEN);
      this.logger.error(`Circuit ${serviceName} opened due to ${circuit.failures} failures`);
    }
  }

  private transitionTo(serviceName: string, newState: CircuitState): void {
    const circuit = this.getCircuit(serviceName);
    const oldState = circuit.state;
    
    circuit.state = newState;
    
    if (newState === CircuitState.OPEN) {
      circuit.openedAt = new Date();
    } else if (newState === CircuitState.CLOSED) {
      this.resetCircuit(serviceName);
    } else if (newState === CircuitState.HALF_OPEN) {
      circuit.successes = 0;
    }

    this.logger.log(`Circuit ${serviceName} transitioned from ${oldState} to ${newState}`);
  }

  private resetFailures(serviceName: string): void {
    const circuit = this.getCircuit(serviceName);
    circuit.failures = 0;
  }

  private resetCircuit(serviceName: string): void {
    const circuit = this.getCircuit(serviceName);
    circuit.failures = 0;
    circuit.successes = 0;
    circuit.openedAt = null;
  }

  /**
   * Exécute une fonction avec protection du circuit breaker
   */
  async execute<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => T | Promise<T>,
  ): Promise<T> {
    if (!this.canCall(serviceName)) {
      this.logger.warn(`Circuit ${serviceName} is open, rejecting call`);
      
      if (fallback) {
        return await fallback();
      }
      
      throw new Error(`Service ${serviceName} is temporarily unavailable (circuit open)`);
    }

    try {
      const result = await operation();
      this.recordSuccess(serviceName);
      return result;
    } catch (error) {
      this.recordFailure(serviceName, error instanceof Error ? error : new Error(String(error)));
      
      if (fallback) {
        this.logger.warn(`Circuit ${serviceName} using fallback due to error`);
        return await fallback();
      }
      
      throw error;
    }
  }

  /**
   * Retourne le statut d'un circuit
   */
  getStatus(serviceName: string): CircuitStatus & { config: CircuitConfig } {
    return {
      ...this.getCircuit(serviceName),
      config: this.getConfig(serviceName),
    };
  }

  /**
   * Retourne le statut de tous les circuits
   */
  getAllStatus(): Map<string, CircuitStatus & { config: CircuitConfig }> {
    const result = new Map();
    for (const [name, circuit] of this.circuits) {
      result.set(name, {
        ...circuit,
        config: this.getConfig(name),
      });
    }
    return result;
  }

  /**
   * Force la fermeture d'un circuit (pour debug/admin)
   */
  forceClose(serviceName: string): void {
    this.transitionTo(serviceName, CircuitState.CLOSED);
    this.logger.log(`Circuit ${serviceName} force closed by admin`);
  }

  /**
   * Force l'ouverture d'un circuit (pour maintenance)
   */
  forceOpen(serviceName: string): void {
    this.transitionTo(serviceName, CircuitState.OPEN);
    this.logger.log(`Circuit ${serviceName} force opened for maintenance`);
  }
}
