import { Injectable, Logger } from '@nestjs/common';

interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBackoff: boolean;
  retryableErrors?: (error: Error) => boolean;
}

interface RetryResult<T> {
  success: boolean;
  result?: T;
  attempts: number;
  lastError?: Error;
}

/**
 * Service de retry avec backoff exponentiel
 */
@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  private readonly defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    exponentialBackoff: true,
  };

  /**
   * Exécute une opération avec retry automatique
   */
  async execute<T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>,
    operationName?: string,
  ): Promise<T> {
    const cfg = { ...this.defaultConfig, ...config };
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          this.logger.log(`${operationName || 'Operation'} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Vérifier si l'erreur est retryable
        if (cfg.retryableErrors && !cfg.retryableErrors(lastError)) {
          this.logger.warn(`${operationName || 'Operation'} failed with non-retryable error`, {
            error: lastError.message,
          });
          throw lastError;
        }
        
        if (attempt < cfg.maxAttempts) {
          const delay = this.calculateDelay(attempt, cfg);
          this.logger.warn(`${operationName || 'Operation'} failed (attempt ${attempt}/${cfg.maxAttempts}), retrying in ${delay}ms`, {
            error: lastError.message,
          });
          await this.sleep(delay);
        }
      }
    }
    
    this.logger.error(`${operationName || 'Operation'} failed after ${cfg.maxAttempts} attempts`, {
      error: lastError?.message,
    });
    
    throw lastError || new Error('Operation failed');
  }

  /**
   * Exécute une opération avec retry et retourne un résultat détaillé
   */
  async executeWithDetails<T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>,
    _operationName?: string,
  ): Promise<RetryResult<T>> {
    const cfg = { ...this.defaultConfig, ...config };
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          result,
          attempts: attempt,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (cfg.retryableErrors && !cfg.retryableErrors(lastError)) {
          return {
            success: false,
            attempts: attempt,
            lastError,
          };
        }
        
        if (attempt < cfg.maxAttempts) {
          const delay = this.calculateDelay(attempt, cfg);
          await this.sleep(delay);
        }
      }
    }
    
    return {
      success: false,
      attempts: cfg.maxAttempts,
      lastError,
    };
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    if (!config.exponentialBackoff) {
      return config.baseDelayMs;
    }
    
    // Backoff exponentiel avec jitter
    const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.3 * exponentialDelay;
    const delay = Math.min(exponentialDelay + jitter, config.maxDelayMs);
    
    return Math.round(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Erreurs réseau communes qui sont retryables
   */
  static isRetryableNetworkError(error: Error): boolean {
    const retryableMessages = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'EHOSTUNREACH',
      'EAI_AGAIN',
      'socket hang up',
      'network error',
      'timeout',
      'rate limit',
      '429',
      '500',
      '502',
      '503',
      '504',
    ];
    
    const errorMessage = error.message.toLowerCase();
    return retryableMessages.some(msg => errorMessage.includes(msg.toLowerCase()));
  }

  /**
   * Erreurs Stripe qui sont retryables
   */
  static isRetryableStripeError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    
    // Erreurs de rate limiting ou réseau Stripe
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return true;
    }
    
    // Erreurs temporaires de l'API Stripe
    if (errorMessage.includes('api_connection_error') || errorMessage.includes('api_error')) {
      return true;
    }
    
    return RetryService.isRetryableNetworkError(error);
  }
}
