import { createLogger, format, transports, Logger } from 'winston';

const { combine, timestamp, errors, splat, json, colorize, printf } = format;

const isJsonFormat = (process.env.WORKER_LOG_FORMAT || '').toLowerCase() === 'json';

const prettyFormat = combine(
  colorize({ all: false }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp: time, level, message, stack, ...metadata }) => {
    const meta = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
    const stackTrace = stack ? `\n${stack}` : '';
    return `${time} [${level}] ${message}${meta}${stackTrace}`;
  })
);

const jsonFormat = combine(timestamp(), errors({ stack: true }), splat(), json());

const baseLogger: Logger = createLogger({
  level:
    process.env.WORKER_LOG_LEVEL ||
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  defaultMeta: { service: 'worker-ia' },
  format: isJsonFormat ? jsonFormat : prettyFormat,
  transports: [new transports.Console()],
});

export const logger = baseLogger;

export const createWorkerLogger = (context: string): Logger =>
  baseLogger.child({ context });

export const serializeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return { ...error } as Record<string, unknown>;
  }

  return { message: String(error) };
};


