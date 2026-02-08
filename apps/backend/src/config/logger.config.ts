/**
 * Winston Logger Configuration
 * - JSON format for production (structured logs for log aggregation)
 * - Human-readable format for development
 * - Correlation IDs for request tracing
 */
import * as winston from 'winston';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

/**
 * Human-readable format for development
 */
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, context, correlationId, ...meta }) => {
    const ctx = context ? `[${context}]` : '';
    const cid = correlationId ? `(${correlationId})` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level} ${ctx}${cid} ${message}${metaStr}`;
  }),
);

/**
 * Structured JSON format for production (compatible with Datadog, ELK, CloudWatch, etc.)
 */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

/**
 * Create Winston logger instance
 */
export function createWinstonLogger(): winston.Logger {
  const isProduction = process.env.NODE_ENV === 'production';

  return winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    defaultMeta: {
      service: 'luneo-backend',
      environment: process.env.NODE_ENV || 'development',
    },
    format: isProduction ? prodFormat : devFormat,
    transports: [
      new winston.transports.Console(),
    ],
    // Don't exit on uncaught errors
    exitOnError: false,
  });
}

/**
 * Singleton instance for use in main.ts and outside NestJS DI
 */
export const winstonLogger = createWinstonLogger();
