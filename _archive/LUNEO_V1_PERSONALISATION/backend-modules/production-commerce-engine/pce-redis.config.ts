/**
 * Parse the BULLMQ_REDIS_URL / REDIS_URL env var into ioredis-compatible
 * connection options that work with Upstash (TLS) and BullMQ
 * (maxRetriesPerRequest: null).
 */
export function parsePCERedisConnection(): Record<string, unknown> {
  const raw = process.env.BULLMQ_REDIS_URL || process.env.REDIS_URL;
  if (!raw) {
    return { host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null };
  }

  try {
    const url = new URL(raw);
    const useTls = url.protocol === 'rediss:';

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
      lazyConnect: true,
      connectTimeout: 10_000,
      retryStrategy(times: number) {
        if (times > 10) return null;
        return Math.min(times * 500, 3_000);
      },
    };
  } catch {
    return { host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null };
  }
}
