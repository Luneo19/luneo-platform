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
 * Sanitize sensitive fields from log metadata in production
 * Complements the LogSanitizerService (which runs inside NestJS DI)
 * for logs that go through Winston directly.
 */
const SENSITIVE_KEYS = new Set([
  'password', 'passwd', 'pwd', 'token', 'accesstoken', 'refreshtoken',
  'apikey', 'api_key', 'secret', 'secretkey', 'jwtsecret',
  'stripesecretkey', 'databaseurl', 'redisurl', 'clientsecret',
  'cloudinaryapisecret', 'authorization', 'cookie',
  'sendgridapikey', 'mailgunapikey', 'openaiapikey', 'replicateapitoken',
]);

function sanitizeValue(key: string, value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const lowerKey = key.toLowerCase().replace(/[_-]/g, '');
  if (SENSITIVE_KEYS.has(lowerKey)) {
    if (value.length <= 8) return '***';
    return value.slice(0, 4) + '***' + value.slice(-4);
  }
  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = sanitizeValue(key, value);
    }
  }
  return result;
}

const sanitizeFormat = winston.format((info) => {
  return sanitizeObject(info) as winston.Logform.TransformableInfo;
});

/**
 * Structured JSON format for production (compatible with Datadog, ELK, CloudWatch, etc.)
 * Includes sanitization of sensitive fields
 */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  sanitizeFormat(),
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
