/**
 * Ecommerce Connector Utilities
 * QUAL-04: Fonctions utilitaires partagées entre les connecteurs ecommerce
 * 
 * NOTE: Classe utilitaire injectable, pas une classe de base abstraite
 * pour éviter les conflits de types avec les implémentations spécifiques.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { EncryptionService } from '@/libs/crypto/encryption.service';
import { SyncLogStatus, SyncLogType, SyncDirection } from '@prisma/client';

/**
 * Interface pour les paramètres de log de synchronisation
 */
export interface SyncLogParams {
  integrationId: string;
  type: SyncLogType;
  direction: SyncDirection;
  status: SyncLogStatus;
  itemsProcessed: number;
  itemsFailed: number;
  errors?: Array<{ itemId: string; code: string; message: string }>;
  startedAt: Date;
}

/**
 * Service utilitaire pour les connecteurs ecommerce
 * Fournit les fonctionnalités communes: encryption, logging, cache, batch processing
 */
@Injectable()
export class EcommerceConnectorUtils {
  private readonly logger = new Logger(EcommerceConnectorUtils.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Chiffre un token/credential sensible
   * SEC-06: Utilisation de EncryptionService pour protéger les tokens
   */
  encryptToken(token: string): string {
    try {
      return this.encryptionService.encrypt(token);
    } catch (error) {
      this.logger.error(`Failed to encrypt token: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }

  /**
   * Déchiffre un token/credential
   */
  decryptToken(encryptedToken: string): string {
    try {
      return this.encryptionService.decrypt(encryptedToken);
    } catch (error) {
      this.logger.error(`Failed to decrypt token: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }

  /**
   * Enregistre un log de synchronisation
   */
  async logSync(params: SyncLogParams): Promise<void> {
    try {
      const duration = Date.now() - params.startedAt.getTime();

      await this.prisma.syncLog.create({
        data: {
          integrationId: params.integrationId,
          type: params.type,
          direction: params.direction,
          status: params.status,
          itemsProcessed: params.itemsProcessed,
          itemsFailed: params.itemsFailed,
          errors: params.errors ?? [],
          duration,
        },
      });

      this.logger.log(
        `Sync log created: ${params.type} ${params.direction} - ` +
        `${params.itemsProcessed} processed, ${params.itemsFailed} failed (${duration}ms)`
      );
    } catch (error) {
      this.logger.error(`Failed to create sync log: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  /**
   * Traite un batch d'éléments en parallèle
   * PERF-01/PERF-02: Batch processing avec Promise.allSettled
   */
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10,
  ): Promise<{ processed: number; failed: number; errors: string[] }> {
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const results = await Promise.allSettled(batch.map(processor));

      for (const result of results) {
        if (result.status === 'fulfilled') {
          processed++;
        } else {
          failed++;
          errors.push(result.reason?.message || 'Unknown error');
        }
      }
    }

    return { processed, failed, errors };
  }

  /**
   * Met en cache une valeur avec clé préfixée
   */
  async setCache(platform: string, key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
    const prefixedKey = `ecommerce:${platform}:${key}`;
    await this.cache.setSimple(prefixedKey, JSON.stringify(value), ttlSeconds);
  }

  /**
   * Récupère une valeur du cache
   */
  async getCache<T>(platform: string, key: string): Promise<T | null> {
    const prefixedKey = `ecommerce:${platform}:${key}`;
    const cached = await this.cache.getSimple(prefixedKey);
    return cached ? JSON.parse(String(cached)) : null;
  }

  /**
   * Invalide une entrée du cache
   */
  async invalidateCache(platform: string, key: string): Promise<void> {
    const prefixedKey = `ecommerce:${platform}:${key}`;
    await this.cache.setSimple(prefixedKey, '', 0);
  }

  /**
   * Calcule le status de synchronisation basé sur les compteurs
   */
  calculateSyncStatus(itemsProcessed: number, itemsFailed: number): SyncLogStatus {
    if (itemsFailed === 0) return 'SUCCESS';
    if (itemsProcessed > 0) return 'PARTIAL';
    return 'FAILED';
  }
}
