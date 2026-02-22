/**
 * @fileoverview Service de retry avec exponential backoff
 * @module RetryService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Exponential backoff
 * - ✅ Jitter pour éviter thundering herd
 * - ✅ Max retries configurable
 * - ✅ Types explicites
 */

import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// TYPES
// ============================================================================

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryableErrors?: Array<string | RegExp>;
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitter: true,
  retryableErrors: [],
  onRetry: () => {},
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  /**
   * Exécute une fonction avec retry automatique
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const config = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Vérifier si l'erreur est retryable
        if (!this.isRetryableError(lastError, config.retryableErrors)) {
          this.logger.debug(
            `Error not retryable: ${lastError.message}, throwing immediately`,
          );
          throw lastError;
        }

        // Si c'est la dernière tentative, throw
        if (attempt === config.maxRetries) {
          this.logger.error(
            `Max retries (${config.maxRetries}) reached, throwing error`,
          );
          throw lastError;
        }

        // Calculer le délai avec exponential backoff
        const delayMs = this.calculateDelay(attempt, config);

        // Callback onRetry
        config.onRetry(lastError, attempt + 1, delayMs);

        this.logger.warn(
          `Retry attempt ${attempt + 1}/${config.maxRetries} after ${delayMs}ms: ${lastError.message}`,
        );

        // Attendre avant de retry
        await this.sleep(delayMs);
      }
    }

    // Ne devrait jamais arriver ici, mais TypeScript le requiert
    throw lastError || new Error('Unknown error in retry service');
  }

  /**
   * Calcule le délai avec exponential backoff et jitter
   */
  private calculateDelay(attempt: number, config: Required<RetryOptions>): number {
    // Exponential backoff: delay = initialDelay * (multiplier ^ attempt)
    const exponentialDelay =
      config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);

    // Appliquer le max delay
    const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

    // Ajouter du jitter pour éviter thundering herd
    if (config.jitter) {
      const jitterAmount = cappedDelay * 0.1; // 10% de jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterAmount; // -10% à +10%
      return Math.round(cappedDelay + jitter);
    }

    return Math.round(cappedDelay);
  }

  /**
   * Vérifie si une erreur est retryable
   */
  private isRetryableError(
    error: Error,
    retryableErrors: Array<string | RegExp>,
  ): boolean {
    // Par défaut, retry sur erreurs réseau/timeout
    const defaultRetryablePatterns = [
      /timeout/i,
      /network/i,
      /ECONNRESET/i,
      /ETIMEDOUT/i,
      /ENOTFOUND/i,
      /ECONNREFUSED/i,
      /503/i, // Service Unavailable
      /502/i, // Bad Gateway
      /504/i, // Gateway Timeout
      /429/i, // Too Many Requests (rate limit)
    ];

    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Vérifier les patterns par défaut
    const matchesDefault = defaultRetryablePatterns.some(
      (pattern) => pattern.test(errorMessage) || pattern.test(errorName),
    );

    if (matchesDefault) {
      return true;
    }

    // Vérifier les patterns personnalisés
    return retryableErrors.some((pattern) => {
      if (typeof pattern === 'string') {
        return errorMessage.includes(pattern.toLowerCase());
      }
      return pattern.test(errorMessage) || pattern.test(errorName);
    });
  }

  /**
   * Sleep utilitaire
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
