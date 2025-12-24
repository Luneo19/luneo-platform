/**
 * @luneo/virtual-try-on - Logger professionnel
 * Système de logs structurés avec niveaux et timestamp
 */

import type { LoggerConfig } from '../core/types';

/**
 * Niveau de log
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Couleurs console par niveau
 */
const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
};

const RESET_COLOR = '\x1b[0m';

/**
 * Logger structuré professionnel
 * 
 * Features:
 * - Niveaux de log (debug, info, warn, error)
 * - Timestamp automatique
 * - Couleurs console
 * - Préfixe personnalisable
 * - Métadonnées structurées
 * 
 * @example
 * ```typescript
 * const logger = new Logger({
 *   level: 'debug',
 *   prefix: '[VirtualTryOn]',
 *   timestamp: true
 * });
 * 
 * logger.info('Camera initialized', { width: 1280, height: 720 });
 * logger.error('Tracking failed', error);
 * ```
 */
export class Logger {
  private config: Required<LoggerConfig>;
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(config: LoggerConfig) {
    this.config = {
      level: config.level || 'info',
      prefix: config.prefix || '',
      timestamp: config.timestamp !== false, // Default true
    };
  }

  /**
   * Log niveau DEBUG
   */
  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  /**
   * Log niveau INFO
   */
  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  /**
   * Log niveau WARN
   */
  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  /**
   * Log niveau ERROR
   */
  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  /**
   * Log avec métriques de performance
   */
  performance(label: string, durationMs: number, metadata?: Record<string, any>): void {
    this.info(
      `⚡ ${label}: ${durationMs.toFixed(2)}ms`,
      metadata
    );
  }

  /**
   * Log principal avec filtrage par niveau
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    // Filtrer par niveau configuré
    if (this.levelPriority[level] < this.levelPriority[this.config.level]) {
      return;
    }

    const parts: string[] = [];

    // Timestamp
    if (this.config.timestamp) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }

    // Niveau
    const levelStr = level.toUpperCase().padEnd(5);
    parts.push(`[${levelStr}]`);

    // Préfixe
    if (this.config.prefix) {
      parts.push(this.config.prefix);
    }

    // Message
    const prefix = parts.join(' ');
    const color = LOG_COLORS[level];
    const fullMessage = `${color}${prefix}${RESET_COLOR} ${message}`;

    // Log approprié selon niveau
    switch (level) {
      case 'debug':
      case 'info':
        console.log(fullMessage, ...args);
        break;
      case 'warn':
        console.warn(fullMessage, ...args);
        break;
      case 'error':
        console.error(fullMessage, ...args);
        break;
    }
  }

  /**
   * Crée un logger enfant avec préfixe additionnel
   */
  child(additionalPrefix: string): Logger {
    return new Logger({
      level: this.config.level,
      prefix: `${this.config.prefix}${additionalPrefix}`,
      timestamp: this.config.timestamp,
    });
  }

  /**
   * Change le niveau de log dynamiquement
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

