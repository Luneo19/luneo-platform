/**
 * Mock Redis Service pour les tests d'intégration
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class MockRedisOptimizedService {
  private cache: Map<string, { value: string; expiry?: number }> = new Map();

  get client() {
    return {
      ping: () => Promise.resolve('PONG'),
      get: (key: string) => this.get(key),
      set: (key: string, value: string, ..._args: unknown[]) => this.set(key, value),
      del: (key: string) => this.delete(key),
      keys: (pattern: string) => this.keys(pattern),
      quit: () => Promise.resolve(),
      disconnect: () => Promise.resolve(),
    };
  }

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const expiry = ttl ? Date.now() + ttl * 1000 : undefined;
    this.cache.set(key, { value, expiry });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.cache.keys()).filter(k => regex.test(k));
  }

  async invalidateByTag(tag: string): Promise<void> {
    const keysToDelete = await this.keys(`*:${tag}:*`);
    keysToDelete.forEach(k => this.cache.delete(k));
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  // Additional methods used by the app
  async hget(key: string, field: string): Promise<string | null> {
    const data = await this.get(key);
    if (!data) return null;
    try {
      const obj = JSON.parse(data);
      return obj[field] || null;
    } catch {
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    let data: Record<string, string> = {};
    const existing = await this.get(key);
    if (existing) {
      try {
        data = JSON.parse(existing);
      } catch {
        data = {};
      }
    }
    data[field] = value;
    await this.set(key, JSON.stringify(data));
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newValue = (parseInt(current || '0', 10) + 1).toString();
    await this.set(key, newValue);
    return parseInt(newValue, 10);
  }

  async expire(key: string, ttl: number): Promise<void> {
    const item = this.cache.get(key);
    if (item) {
      item.expiry = Date.now() + ttl * 1000;
    }
  }

  async ttl(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item || !item.expiry) return -1;
    return Math.max(0, Math.floor((item.expiry - Date.now()) / 1000));
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; latency: number }> {
    return { status: 'healthy', latency: 1 };
  }

  // Get Redis client directly (for services that need raw access)
  getRedis() {
    return this.client;
  }

  // Optimized cache methods
  async getOptimized<T>(key: string, namespace: string): Promise<T | null> {
    const data = await this.get(`${namespace}:${key}`);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async setOptimized<T>(key: string, value: T, namespace: string, options?: { ttl?: number }): Promise<void> {
    await this.set(`${namespace}:${key}`, JSON.stringify(value), options?.ttl);
  }

  async deleteOptimized(key: string, namespace: string): Promise<void> {
    await this.delete(`${namespace}:${key}`);
  }

  // Rate limiting methods
  async checkRateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
    const count = await this.incr(key);
    if (count === 1) {
      await this.expire(key, Math.ceil(windowMs / 1000));
    }
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
    };
  }
}
