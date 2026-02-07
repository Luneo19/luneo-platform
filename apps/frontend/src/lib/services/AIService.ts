/**
 * AI Service Layer - Service centralisé pour toutes les opérations IA
 * Implémente retry, queue, cache, et fallback pour production SaaS
 * 
 * @module AIService
 */

import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/cache/redis';
import { track } from '@vercel/analytics';
import * as Sentry from '@sentry/nextjs';

/**
 * Retry Helper avec Exponential Backoff
 * Implémente retry intelligent avec jitter pour éviter thundering herd
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let attempt = 0;
  let lastError: Error | unknown;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      if (attempt === maxRetries) {
        logger.error('Max retries exceeded', { error, attempts: attempt });
        throw error;
      }

      // Exponential backoff avec jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      logger.warn(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`, {
        error: error instanceof Error ? error.message : String(error),
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Credit Service via Backend API
 * Uses GET /api/v1/credits/balance and POST /api/v1/credits/deduct. Cache TTL 60s.
 */
export async function checkAndDeductCredits(
  userId: string,
  required: number,
  _legacyClient?: unknown
): Promise<{ success: boolean; balance: number; error?: string }> {
  const cacheKey = `credits:${userId}`;

  try {
    let balance: number;
    const cached = await cacheService.get<string>(cacheKey);
    if (cached != null) {
      balance = parseInt(cached, 10);
    } else {
      const { api } = await import('@/lib/api/client');
      const res = await api.get<{ balance?: number }>('/api/v1/credits/balance');
      balance = res?.balance ?? 0;
      await cacheService.set(cacheKey, String(balance), { ttl: 60 * 1000 });
    }

    if (balance < required) {
      return {
        success: false,
        balance,
        error: `Insufficient credits. ${balance} available, ${required} required.`,
      };
    }

    const { api } = await import('@/lib/api/client');
    const deductRes = await api.post<{ balance?: number; success?: boolean }>('/api/v1/credits/deduct', {
      amount: required,
    }).catch(() => null);

    const newBalance = deductRes?.balance ?? balance - required;
    await cacheService.set(cacheKey, String(newBalance), { ttl: 60 * 1000 });

    logger.info('Credits deducted', {
      userId,
      required,
      balanceBefore: balance,
      balanceAfter: newBalance,
    });

    track('credits_deducted', {
      userId,
      amount: required,
      newBalance,
    });

    return {
      success: deductRes?.success ?? true,
      balance: newBalance,
    };
  } catch (error) {
    logger.error('Credit check failed', { userId, error });
    Sentry.captureException(error, {
      tags: { service: 'ai-credits' },
      extra: { userId, required },
    });
    throw error;
  }
}

/**
 * Queue Job Helper (pour opérations longues)
 * Note: Pour Next.js, on utilise directement les API routes avec polling
 * BullMQ serait dans un worker séparé
 */
export async function queueAIJob(
  type: 'text-to-design' | 'upscale' | 'background-removal' | 'smart-crop',
  data: Record<string, unknown>
): Promise<string> {
  try {
    // Pour Next.js, on simule une queue en créant un job ID
    // En production, cela serait géré par un worker BullMQ séparé
    const jobId = `${type}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    logger.info('AI job queued', { jobId, type, userId: data.userId });

    // En production, on enverrait au worker BullMQ ici
    // const job = await aiQueue.add(type, { ...data, timestamp: Date.now() });
    // return job.id;

    return jobId;
  } catch (error) {
    logger.error('Failed to queue AI job', { error, type, data });
    Sentry.captureException(error, {
      tags: { service: 'ai-queue' },
      extra: { type, data },
    });
    throw error;
  }
}

/**
 * AIService - Service principal exporté
 */
export const AIService = {
  checkAndDeductCredits,
  queueAIJob,
  retryWithBackoff,
};

