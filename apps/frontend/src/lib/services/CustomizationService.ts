/**
 * ★★★ SERVICE - PERSONNALISATION ★★★
 * Service frontend pour gérer les personnalisations
 * - Génération
 * - Cache management
 * - Error handling
 * - Retry logic
 */

import { trpc } from '@/lib/trpc/client';
import { logger } from '@/lib/logger';
import { validatePrompt, sanitizePrompt, generateCacheKey } from '@/lib/utils/customization';
import type { CustomizationOptions } from '@/lib/utils/customization';
import type {
  GenerateCustomizationRequest,
  GenerateCustomizationResponse,
  CustomizationStatusResponse,
} from '@/lib/types/customization';

// ========================================
// SERVICE
// ========================================

export class CustomizationService {
  private static instance: CustomizationService;
  private cache: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): CustomizationService {
    if (!CustomizationService.instance) {
      CustomizationService.instance = new CustomizationService();
    }
    return CustomizationService.instance;
  }

  // ========================================
  // GENERATION
  // ========================================

  /**
   * Génère une personnalisation depuis un prompt
   */
  async generate(
    request: GenerateCustomizationRequest,
    options?: CustomizationOptions
  ): Promise<GenerateCustomizationResponse> {
    try {
      // Validation
      const validation = validatePrompt(request.prompt);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Sanitization
      const sanitizedPrompt = sanitizePrompt(request.prompt);

      // Check cache
      const cacheKey = generateCacheKey(sanitizedPrompt, options || {}, request.zoneId);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.info('Cache hit for customization', { cacheKey });
        return cached;
      }

      // Generate
      const result = await trpc.customization.generateFromPrompt.mutate({
        ...request,
        prompt: sanitizedPrompt,
        ...options,
      });

      // Cache result
      this.cache.set(cacheKey, result);

      logger.info('Customization generated', { customizationId: result.id });

      return result;
    } catch (error: any) {
      logger.error('Error generating customization', { error, request });
      throw error;
    }
  }

  // ========================================
  // STATUS
  // ========================================

  /**
   * Vérifie le statut d'une personnalisation
   */
  async checkStatus(customizationId: string): Promise<CustomizationStatusResponse> {
    try {
      const status = await trpc.customization.checkStatus.query({ id: customizationId });
      return status;
    } catch (error: any) {
      logger.error('Error checking customization status', { error, customizationId });
      throw error;
    }
  }

  /**
   * Poll le statut jusqu'à completion ou timeout
   */
  async pollStatus(
    customizationId: string,
    options: {
      interval?: number;
      maxAttempts?: number;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<CustomizationStatusResponse> {
    const { interval = 2000, maxAttempts = 150, onProgress } = options;

    let attempts = 0;
    let progress = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          progress = Math.min((attempts / maxAttempts) * 100, 90);

          onProgress?.(progress);

          const status = await this.checkStatus(customizationId);

          if (status.status === 'COMPLETED') {
            resolve(status);
            return;
          }

          if (status.status === 'FAILED') {
            reject(new Error(status.errorMessage || 'Génération échouée'));
            return;
          }

          if (attempts >= maxAttempts) {
            reject(new Error('Timeout: la génération a pris trop de temps'));
            return;
          }

          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  // ========================================
  // CRUD
  // ========================================

  /**
   * Récupère une personnalisation par ID
   */
  async getById(customizationId: string) {
    try {
      return await trpc.customization.getById.query({ id: customizationId });
    } catch (error: any) {
      logger.error('Error fetching customization', { error, customizationId });
      throw error;
    }
  }

  /**
   * Liste les personnalisations de l'utilisateur
   */
  async list(options?: {
    productId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      return await trpc.customization.listMine.query(options);
    } catch (error: any) {
      logger.error('Error listing customizations', { error, options });
      throw error;
    }
  }

  /**
   * Met à jour une personnalisation
   */
  async update(customizationId: string, data: { name?: string; description?: string; options?: any }) {
    try {
      return await trpc.customization.update.mutate({
        id: customizationId,
        ...data,
      });
    } catch (error: any) {
      logger.error('Error updating customization', { error, customizationId, data });
      throw error;
    }
  }

  /**
   * Supprime une personnalisation
   */
  async delete(customizationId: string) {
    try {
      return await trpc.customization.delete.mutate({ id: customizationId });
    } catch (error: any) {
      logger.error('Error deleting customization', { error, customizationId });
      throw error;
    }
  }

  // ========================================
  // CACHE
  // ========================================

  /**
   * Vide le cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Customization cache cleared');
  }

  /**
   * Récupère depuis le cache
   */
  getFromCache(key: string) {
    return this.cache.get(key);
  }

  /**
   * Met en cache
   */
  setCache(key: string, value: any) {
    this.cache.set(key, value);
  }
}

// ========================================
// EXPORT
// ========================================

export const customizationService = CustomizationService.getInstance();

