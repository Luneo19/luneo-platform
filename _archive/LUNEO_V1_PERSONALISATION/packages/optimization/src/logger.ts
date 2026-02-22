/**
 * @luneo/optimization - Logger interne
 * Encapsule les appels console avec un prefixe et un niveau configurable.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

class OptimizationLogger {
  private level: LogLevel;
  private prefix: string;

  constructor(prefix = '[LuneoOptimization]', level: LogLevel = 'warn') {
    this.prefix = prefix;
    this.level = level;
  }

  debug(message: string, ...args: unknown[]): void {
    if (LEVEL_PRIORITY[this.level] <= LEVEL_PRIORITY.debug) {
      // eslint-disable-next-line no-console
      console.debug(`${this.prefix} ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (LEVEL_PRIORITY[this.level] <= LEVEL_PRIORITY.info) {
      // eslint-disable-next-line no-console
      console.info(`${this.prefix} ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (LEVEL_PRIORITY[this.level] <= LEVEL_PRIORITY.warn) {
      // eslint-disable-next-line no-console
      console.warn(`${this.prefix} ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (LEVEL_PRIORITY[this.level] <= LEVEL_PRIORITY.error) {
      // eslint-disable-next-line no-console
      console.error(`${this.prefix} ${message}`, ...args);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

export const logger = new OptimizationLogger();
