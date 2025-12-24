/**
 * Safe Logger Service
 * Logger with automatic secret sanitization
 */

import { Injectable, Logger, LoggerService } from '@nestjs/common';
import { LogSanitizerService } from './log-sanitizer.service';

@Injectable()
export class SafeLoggerService implements LoggerService {
  private readonly logger: Logger;
  private readonly sanitizer: LogSanitizerService;

  constructor(
    context?: string,
    sanitizer?: LogSanitizerService,
  ) {
    this.logger = new Logger(context || 'SafeLogger');
    this.sanitizer = sanitizer || new LogSanitizerService();
  }

  /**
   * Log a message (development only)
   */
  log(message: any, context?: string): void {
    const sanitized = this.sanitizeMessage(message);
    this.logger.log(sanitized, context);
  }

  /**
   * Log an error
   */
  error(message: any, trace?: string, context?: string): void {
    const sanitizedMessage = this.sanitizeMessage(message);
    const sanitizedTrace = trace ? this.sanitizeMessage(trace) : undefined;
    this.logger.error(sanitizedMessage, sanitizedTrace, context);
  }

  /**
   * Log a warning
   */
  warn(message: any, context?: string): void {
    const sanitized = this.sanitizeMessage(message);
    this.logger.warn(sanitized, context);
  }

  /**
   * Log debug info (development only)
   */
  debug(message: any, context?: string): void {
    const sanitized = this.sanitizeMessage(message);
    this.logger.debug(sanitized, context);
  }

  /**
   * Log verbose info (development only)
   */
  verbose(message: any, context?: string): void {
    const sanitized = this.sanitizeMessage(message);
    this.logger.verbose(sanitized, context);
  }

  /**
   * Sanitize message before logging
   */
  private sanitizeMessage(message: any): any {
    if (message === null || message === undefined) {
      return message;
    }

    // If it's an Error object, sanitize the message and stack
    if (message instanceof Error) {
      const sanitized = new Error(this.sanitizer.sanitize(message.message));
      sanitized.stack = message.stack
        ? this.sanitizer.sanitize(message.stack)
        : undefined;
      sanitized.name = message.name;
      return sanitized;
    }

    // If it's a string, sanitize it
    if (typeof message === 'string') {
      return this.sanitizer.sanitize(message);
    }

    // If it's an object, sanitize it recursively
    if (typeof message === 'object') {
      return this.sanitizer.sanitizeObject(message);
    }

    // For other types, convert to string and sanitize
    return this.sanitizer.sanitize(String(message));
  }
}

/**
 * Create a safe logger instance
 */
export function createSafeLogger(context?: string): SafeLoggerService {
  return new SafeLoggerService(context);
}

