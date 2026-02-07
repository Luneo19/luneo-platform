/**
 * @fileoverview Service de logging spécialisé pour IA
 * @module LoggerService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Logger structuré (JSON)
 * - ✅ Niveaux de log appropriés
 * - ✅ Pas de console.log
 * - ✅ Intégration Sentry pour erreurs critiques
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ============================================================================
// TYPES
// ============================================================================

export interface AILogContext {
  brandId?: string;
  userId?: string;
  agentId?: string;
  conversationId?: string;
  requestId?: string;
  provider?: string;
  model?: string;
  operation?: string;
  [key: string]: unknown;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class LoggerService {
  private readonly logger = new Logger(LoggerService.name);
  private readonly logLevel: string;

  constructor(private readonly configService: ConfigService) {
    this.logLevel = this.configService.get<string>('AI_LOG_LEVEL') || 'info';
  }

  /**
   * Log info
   */
  logInfo(message: string, context?: AILogContext): void {
    if (this.shouldLog('info')) {
      this.logger.log(this.formatMessage(message, context));
    }
  }

  /**
   * Log error
   */
  logError(message: string, error?: Error | unknown, context?: AILogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error,
      };

      this.logger.error(this.formatMessage(message, errorContext));

      if (this.configService.get<boolean>('SENTRY_ENABLED') && error) {
        try {
          const Sentry = require('@sentry/node');
          Sentry.captureException(error, { extra: errorContext });
        } catch {
          /* Sentry not installed */
        }
      }
    }
  }

  /**
   * Log warning
   */
  logWarn(message: string, context?: AILogContext): void {
    if (this.shouldLog('warn')) {
      this.logger.warn(this.formatMessage(message, context));
    }
  }

  /**
   * Log debug
   */
  logDebug(message: string, context?: AILogContext): void {
    if (this.shouldLog('debug')) {
      this.logger.debug(this.formatMessage(message, context));
    }
  }

  /**
   * Log performance
   */
  logPerformance(
    operation: string,
    durationMs: number,
    context?: AILogContext,
  ): void {
    if (this.shouldLog('info')) {
      this.logger.log(
        this.formatMessage(`Performance: ${operation} took ${durationMs}ms`, {
          ...context,
          durationMs,
          operation,
        }),
      );
    }
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Formate le message avec contexte
   */
  private formatMessage(message: string, context?: AILogContext): string {
    if (!context || Object.keys(context).length === 0) {
      return message;
    }

    // Format JSON structuré pour parsing
    return `${message} | ${JSON.stringify(context)}`;
  }

  /**
   * Vérifie si on doit logger selon le niveau
   */
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);

    return requestedLevelIndex >= currentLevelIndex;
  }
}
