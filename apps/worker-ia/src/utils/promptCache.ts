import { createHash } from 'crypto';
import Redis, { type RedisOptions } from 'ioredis';
import type { GenerateImageResult } from '../jobs/generateImage';

const DEFAULT_TTL = parseInt(process.env.PROMPT_CACHE_TTL_SECONDS || '600', 10);

export interface PromptCacheEntry {
  imageBase64: string;
  thumbnailBase64: string;
  metadata?: GenerateImageResult['metadata'];
  createdAt: string;
}

type RedisConnection = string | RedisOptions | undefined;

export class PromptCache {
  private readonly client?: Redis;
  private readonly ttl: number;

  constructor(connection: RedisConnection, ttlSeconds: number = DEFAULT_TTL) {
    this.ttl = ttlSeconds;

    if (ttlSeconds <= 0 || !connection) {
      this.client = undefined;
      return;
    }

    if (typeof connection === 'string') {
      this.client = new Redis(connection);
    } else {
      this.client = new Redis(connection);
    }
  }

  async get(key: string): Promise<PromptCacheEntry | null> {
    if (!this.client) return null;
    try {
      const value = await this.client.get(key);
      return value ? (JSON.parse(value) as PromptCacheEntry) : null;
    } catch (error) {
      return null;
    }
  }

  async set(key: string, entry: PromptCacheEntry): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(entry), 'EX', this.ttl);
    } catch (error) {
      // swallow cache errors
    }
  }

  async dispose(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.quit();
    } catch (error) {
      await this.client.disconnect();
    }
  }
}

export const computePromptKey = (data: {
  prompt: string;
  style: string;
  dimensions: string;
  quality: string;
}) =>
  createHash('sha256')
    .update(`${data.prompt}|${data.style}|${data.dimensions}|${data.quality}`)
    .digest('hex');

