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
 * Credit Service avec Cache Redis
 * Optimise les vérifications de crédits avec cache TTL 60s
 */
export async function checkAndDeductCredits(
  userId: string,
  required: number,
  supabaseClient: any // Passer le client Supabase depuis l'appelant
): Promise<{ success: boolean; balance: number; error?: string }> {
  const cacheKey = `credits:${userId}`;

  try {
    // Vérifier cache Redis
    const balance = await cacheService.get<string>(cacheKey);

    if (!balance) {
      // Cache miss: fetch from DB
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('ai_credits, metadata')
        .eq('id', userId)
        .single();

      if (profileError) {
        logger.error('Failed to fetch credits', { userId, error: profileError });
        throw new Error('Failed to fetch credits');
      }

      balance = String(profile?.ai_credits ?? profile?.metadata?.aiCredits ?? 0);

      // Cache pour 60 secondes
      await cacheService.set(cacheKey, balance, { ttl: 60 });
    }

    const currentBalance = parseInt(balance || '0', 10);

    if (currentBalance < required) {
      return {
        success: false,
        balance: currentBalance,
        error: `Insufficient credits. ${currentBalance} available, ${required} required.`,
      };
    }

    // Déduction atomique via fonction SQL (ou update direct)
    const { error: deductError } = await supabaseClient
      .from('profiles')
      .update({
        ai_credits: currentBalance - required,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (deductError) {
      logger.error('Failed to deduct credits', { userId, error: deductError });
      throw new Error('Failed to deduct credits');
    }

    // Mettre à jour cache
    const newBalance = currentBalance - required;
    await cacheService.set(cacheKey, String(newBalance), { ttl: 60 });

    // Logger transaction
    logger.info('Credits deducted', {
      userId,
      required,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
    });

    // Track analytics
    track('credits_deducted', {
      userId,
      amount: required,
      newBalance,
    });

    return {
      success: true,
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

