/**
 * 🔐 OAUTH STATE MANAGEMENT - Luneo Platform
 * 
 * Gestion de l'état OAuth pour la protection CSRF
 * Supporte Redis (Upstash) et fallback mémoire
 * Pour un SaaS professionnel et sécurisé
 */

import { logger } from './logger';
import crypto from 'crypto';

interface OAuthState {
  state: string;
  userId: string;
  provider: string;
  redirectUrl?: string;
  metadata?: Record<string, any>;
  createdAt: number;
  expiresAt: number;
}

// In-memory store as fallback (cleared on server restart)
const memoryStore = new Map<string, OAuthState>();

// TTL par défaut: 10 minutes
const DEFAULT_TTL_SECONDS = 600;

/**
 * Générer un état OAuth sécurisé
 */
export function generateOAuthState(
  userId: string,
  provider: string,
  redirectUrl?: string,
  metadata?: Record<string, any>
): string {
  const state = crypto.randomBytes(32).toString('hex');
  const createdAt = Date.now();
  const expiresAt = createdAt + DEFAULT_TTL_SECONDS * 1000;

  const oauthState: OAuthState = {
    state,
    userId,
    provider,
    redirectUrl,
    metadata,
    createdAt,
    expiresAt,
  };

  // Store in memory immediately
  memoryStore.set(state, oauthState);

  // Try to store in Redis if available
  storeOAuthState(state, oauthState).catch((error) => {
    logger.warn('Failed to store OAuth state in Redis, using memory store', {
      state,
      userId,
      provider,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  logger.info('OAuth state generated', {
    state,
    userId,
    provider,
    expiresAt: new Date(expiresAt).toISOString(),
  });

  return state;
}

/**
 * Stocker un état OAuth dans Redis
 */
async function storeOAuthState(state: string, oauthState: OAuthState): Promise<void> {
  try {
    // Try to use Upstash Redis if available
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis');

      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      const key = `oauth:state:${state}`;
      const ttl = Math.floor((oauthState.expiresAt - Date.now()) / 1000);

      await redis.setex(key, ttl, JSON.stringify(oauthState));

      logger.debug('OAuth state stored in Redis', {
        state,
        ttl,
      });
      return;
    }

    // Try generic Redis URL
    if (process.env.REDIS_URL) {
      const redis = require('redis');
      const client = redis.createClient({
        url: process.env.REDIS_URL,
      });

      await client.connect();

      const key = `oauth:state:${state}`;
      const ttl = Math.floor((oauthState.expiresAt - Date.now()) / 1000);

      await client.setEx(key, ttl, JSON.stringify(oauthState));
      await client.quit();

      logger.debug('OAuth state stored in Redis', {
        state,
        ttl,
      });
      return;
    }

    // No Redis available, will use memory store
  } catch (error) {
    // Redis not available or error, will use memory store
    if (error instanceof Error && !error.message.includes('MODULE_NOT_FOUND')) {
      logger.warn('Redis storage error', error, {
        state,
      });
    }
  }
}

/**
 * Vérifier et récupérer un état OAuth
 */
export async function verifyOAuthState(
  state: string,
  expectedProvider?: string
): Promise<OAuthState | null> {
  try {
    // Clean expired states from memory
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
      if (value.expiresAt < now) {
        memoryStore.delete(key);
      }
    }

    // Try Redis first
    const redisState = await getOAuthStateFromRedis(state);
    if (redisState) {
      // Validate state
      if (redisState.expiresAt < Date.now()) {
        logger.warn('OAuth state expired', { state });
        return null;
      }

      if (expectedProvider && redisState.provider !== expectedProvider) {
        logger.warn('OAuth state provider mismatch', {
          state,
          expected: expectedProvider,
          actual: redisState.provider,
        });
        return null;
      }

      // Remove from memory store if exists
      memoryStore.delete(state);

      logger.info('OAuth state verified from Redis', {
        state,
        userId: redisState.userId,
        provider: redisState.provider,
      });

      return redisState;
    }

    // Fallback to memory store
    const memoryState = memoryStore.get(state);
    if (memoryState) {
      // Validate state
      if (memoryState.expiresAt < Date.now()) {
        memoryStore.delete(state);
        logger.warn('OAuth state expired', { state });
        return null;
      }

      if (expectedProvider && memoryState.provider !== expectedProvider) {
        logger.warn('OAuth state provider mismatch', {
          state,
          expected: expectedProvider,
          actual: memoryState.provider,
        });
        return null;
      }

      // Remove after use (one-time use)
      memoryStore.delete(state);

      logger.info('OAuth state verified from memory', {
        state,
        userId: memoryState.userId,
        provider: memoryState.provider,
      });

      return memoryState;
    }

    logger.warn('OAuth state not found', { state });
    return null;
  } catch (error) {
    logger.error('Error verifying OAuth state', error instanceof Error ? error : new Error(String(error)), {
      state,
    });
    return null;
  }
}

/**
 * Récupérer un état OAuth depuis Redis
 */
async function getOAuthStateFromRedis(state: string): Promise<OAuthState | null> {
  try {
    // Try Upstash Redis
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis');

      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      const key = `oauth:state:${state}`;
      const data = await redis.get<string>(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as OAuthState;
    }

    // Try generic Redis
    if (process.env.REDIS_URL) {
      const redis = require('redis');
      const client = redis.createClient({
        url: process.env.REDIS_URL,
      });

      await client.connect();

      const key = `oauth:state:${state}`;
      const data = await client.get(key);
      await client.quit();

      if (!data) {
        return null;
      }

      return JSON.parse(data) as OAuthState;
    }

    return null;
  } catch (error) {
    // Redis not available or error
    if (error instanceof Error && !error.message.includes('MODULE_NOT_FOUND')) {
      logger.warn('Redis retrieval error', error instanceof Error ? error : new Error(String(error)), {
        state,
      });
    }
    return null;
  }
}

/**
 * Supprimer un état OAuth (après utilisation)
 */
export async function deleteOAuthState(state: string): Promise<void> {
  try {
    // Remove from memory
    memoryStore.delete(state);

    // Remove from Redis if available
    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const { Redis } = await import('@upstash/redis');

        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        const key = `oauth:state:${state}`;
        await redis.del(key);
      } else if (process.env.REDIS_URL) {
        const redis = require('redis');
        const client = redis.createClient({
          url: process.env.REDIS_URL,
        });

        await client.connect();
        await client.del(`oauth:state:${state}`);
        await client.quit();
      }
    } catch (error) {
      // Ignore Redis errors
    }

    logger.debug('OAuth state deleted', { state });
  } catch (error) {
    logger.error('Error deleting OAuth state', error instanceof Error ? error : new Error(String(error)), {
      state,
    });
  }
}

/**
 * Nettoyer les états OAuth expirés
 */
export async function cleanupExpiredOAuthStates(): Promise<void> {
  try {
    const now = Date.now();
    let cleaned = 0;

    // Clean memory store
    for (const [key, value] of memoryStore.entries()) {
      if (value.expiresAt < now) {
        memoryStore.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned expired OAuth states', { cleaned });
    }
  } catch (error) {
    logger.error('Error cleaning expired OAuth states', error instanceof Error ? error : new Error(String(error)));
  }
}


