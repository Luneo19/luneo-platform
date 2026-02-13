/**
 * ★★★ SERVICE - FEATURE FLAGS ★★★
 * Service professionnel pour les feature flags
 * - Feature flags dynamiques
 * - A/B testing
 * - Gradual rollouts
 * - User targeting
 */

import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/cache/CacheService';

// ========================================
// TYPES
// ========================================

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  targetUsers?: string[];
  targetBrands?: string[];
  conditions?: Record<string, unknown>;
}

export interface ABTest {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    name: string;
    percentage: number;
  }>;
  startDate: Date;
  endDate?: Date;
  active: boolean;
}

// ========================================
// SERVICE
// ========================================

export class FeatureFlagsService {
  private static instance: FeatureFlagsService;
  private flags: Map<string, FeatureFlag> = new Map();
  private abTests: Map<string, ABTest> = new Map();

  private constructor() {
    this.loadFlags();
  }

  static getInstance(): FeatureFlagsService {
    if (!FeatureFlagsService.instance) {
      FeatureFlagsService.instance = new FeatureFlagsService();
    }
    return FeatureFlagsService.instance;
  }

  // ========================================
  // FLAGS
  // ========================================

  /**
   * Charge les flags depuis le cache/API
   */
  private async loadFlags(): Promise<void> {
    try {
      // Try to load from cache first
      const cachedFlags = await cacheService.get<FeatureFlag[]>('feature-flags:all');
      if (cachedFlags) {
        cachedFlags.forEach((flag) => {
          this.flags.set(flag.key, flag);
        });
        logger.info('Feature flags loaded from cache', { count: this.flags.size });
        return;
      }

      // Load from API
      try {
        const flags = await api.get<FeatureFlag[]>('/api/v1/features');
        if (Array.isArray(flags)) {
          flags.forEach((flag: FeatureFlag) => {
            this.flags.set(flag.key, flag);
          });
          cacheService.set('feature-flags:all', flags, { ttl: 5 * 60 * 1000 });
          logger.info('Feature flags loaded from API', { count: this.flags.size });
          return;
        }
      } catch (apiError) {
        logger.warn('Failed to load feature flags from API, using defaults', { error: apiError });
      }

      // Default flags (fallback)
      this.flags.set('real-time-collaboration', {
        key: 'real-time-collaboration',
        enabled: true,
        rolloutPercentage: 100,
      });

      this.flags.set('advanced-analytics', {
        key: 'advanced-analytics',
        enabled: false,
        rolloutPercentage: 50,
      });

      logger.info('Feature flags loaded (defaults)', { count: this.flags.size });
    } catch (error: unknown) {
      logger.error('Error loading feature flags', { error });
    }
  }

  /**
   * Récupère un flag spécifique
   */
  async getFlag(key: string): Promise<FeatureFlag | null> {
    // Check cache first
    const cached = await cacheService.get<FeatureFlag>(`feature-flag:${key}`);
    if (cached) {
      this.flags.set(key, cached);
      return cached;
    }

    // Load from API
    try {
      const flag = await api.get<FeatureFlag>(`/api/v1/features/${key}`);
      if (flag) {
        this.flags.set(key, flag);
        cacheService.set(`feature-flag:${key}`, flag, { ttl: 5 * 60 * 1000 });
        return flag;
      }
    } catch (error) {
      logger.error('Error loading feature flag from API', { error, key });
    }

    return this.flags.get(key) || null;
  }

  /**
   * Vérifie si un flag est activé
   */
  isEnabled(
    key: string,
    userId?: string,
    brandId?: string
  ): boolean {
    const flag = this.flags.get(key);

    if (!flag) {
      return false;
    }

    if (!flag.enabled) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      // Simple hash-based rollout
      const hash = this.hashString(`${key}:${userId || 'anonymous'}`);
      const percentage = (hash % 100) + 1;
      if (percentage > flag.rolloutPercentage) {
        return false;
      }
    }

    // Check target users
    if (flag.targetUsers && userId) {
      if (!flag.targetUsers.includes(userId)) {
        return false;
      }
    }

    // Check target brands
    if (flag.targetBrands && brandId) {
      if (!flag.targetBrands.includes(brandId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Récupère tous les flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Met à jour un flag
   */
  async updateFlag(flag: FeatureFlag): Promise<void> {
    this.flags.set(flag.key, flag);

    // Save to API
    try {
      await api.put('/api/v1/features', flag);

      // Invalidate cache
      await cacheService.delete(`feature-flag:${flag.key}`);
      await cacheService.delete('feature-flags:all');

      logger.info('Feature flag updated', { key: flag.key });
    } catch (error: unknown) {
      logger.error('Error updating feature flag', { error, flag });
      throw error;
    }
  }

  /**
   * Définit un flag (alias pour updateFlag)
   */
  async setFlag(key: string, enabled: boolean, options?: Partial<FeatureFlag>): Promise<void> {
    const existingFlag = this.flags.get(key) || {
      key,
      enabled: false,
    };

    const updatedFlag: FeatureFlag = {
      ...existingFlag,
      ...options,
      key,
      enabled,
    };

    await this.updateFlag(updatedFlag);
  }

  // ========================================
  // A/B TESTING
  // ========================================

  /**
   * Récupère la variante d'un test A/B
   */
  getABTestVariant(testId: string, userId: string): string | null {
    const test = this.abTests.get(testId);

    if (!test || !test.active) {
      return null;
    }

    const now = new Date();
    if (now < test.startDate || (test.endDate && now > test.endDate)) {
      return null;
    }

    // Hash-based variant assignment
    const hash = this.hashString(`${testId}:${userId}`);
    const percentage = hash % 100;

    let cumulative = 0;
    for (const variant of test.variants) {
      cumulative += variant.percentage;
      if (percentage < cumulative) {
        return variant.id;
      }
    }

    return test.variants[0]?.id || null;
  }

  // ========================================
  // UTILS
  // ========================================

  /**
   * Hash simple pour le rollout
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// ========================================
// EXPORT
// ========================================

export const featureFlags = FeatureFlagsService.getInstance();

// Hook React
export function useFeatureFlag(
  key: string,
  userId?: string,
  brandId?: string
): boolean {
  return featureFlags.isEnabled(key, userId, brandId);
}

