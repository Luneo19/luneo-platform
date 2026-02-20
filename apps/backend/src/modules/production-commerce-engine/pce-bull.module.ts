import { DynamicModule, Logger, Module } from '@nestjs/common';
import { BullModule, RegisterQueueOptions } from '@nestjs/bullmq';

/**
 * Wrapper around @nestjs/bullmq that isolates the PCE BullMQ root config
 * from the app-level @nestjs/bull config.
 *
 * `BullModule.forRoot()` from @nestjs/bullmq is @Global() by default,
 * which can interfere when the app already uses @nestjs/bull.
 * This module sets `global: false` on the root config so it stays
 * scoped to the PCE module tree.
 */
const logger = new Logger('PCEBullModule');

function parsePCERedisOpts(): Record<string, unknown> {
  const raw = process.env.BULLMQ_REDIS_URL || process.env.REDIS_URL;
  if (!raw) {
    logger.warn('No BULLMQ_REDIS_URL or REDIS_URL set — defaulting to localhost:6379');
    return { host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null };
  }

  try {
    const url = new URL(raw);
    const useTls = url.protocol === 'rediss:';

    logger.log(`Redis → ${url.hostname}:${url.port || 6379}${useTls ? ' (TLS)' : ''}`);

    return {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
      ...(url.username && url.username !== 'default'
        ? { username: decodeURIComponent(url.username) }
        : {}),
      ...(useTls ? { tls: { rejectUnauthorized: true } } : {}),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 10_000,
    };
  } catch {
    logger.warn('Failed to parse Redis URL — defaulting to localhost:6379');
    return { host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null };
  }
}

@Module({})
export class PCEBullModule {
  static forRoot(): DynamicModule {
    const root = BullModule.forRoot({ connection: parsePCERedisOpts() as never });
    return { ...root, global: false };
  }

  static registerQueue(...opts: RegisterQueueOptions[]): DynamicModule {
    return BullModule.registerQueue(...opts);
  }
}
