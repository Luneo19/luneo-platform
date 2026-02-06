import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

/**
 * Service d'idempotence pour éviter le traitement en double des webhooks et opérations
 * Utilise une table de base de données pour stocker les clés d'idempotence
 */
@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Vérifie si une opération a déjà été traitée
   * @param key Clé unique d'idempotence (ex: webhook_event_id)
   * @returns true si déjà traité, false sinon
   */
  async isProcessed(key: string): Promise<boolean> {
    try {
      // Note: Temporary type assertion until Prisma client is regenerated
      const existing = await (this.prisma as any).idempotencyKey.findUnique({
        where: { key },
      });
      return !!existing;
    } catch (error) {
      // Si la table n'existe pas, considérer comme non traité
      this.logger.warn(`Idempotency check failed for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Marque une opération comme traitée avec résultat
   * @param key Clé unique d'idempotence
   * @param result Résultat de l'opération (optionnel)
   * @param ttlSeconds Durée de vie en secondes (par défaut 7 jours)
   */
  async markAsProcessed(key: string, result?: any, ttlSeconds: number = 604800): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      
      // Note: Temporary type assertion until Prisma client is regenerated
      await (this.prisma as any).idempotencyKey.upsert({
        where: { key },
        create: {
          key,
          result: result ? JSON.stringify(result) : null,
          expiresAt,
        },
        update: {
          result: result ? JSON.stringify(result) : null,
          expiresAt,
        },
      });
      
      this.logger.debug(`Marked operation as processed: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to mark operation as processed: ${key}`, error);
      // Ne pas faire échouer l'opération principale
    }
  }

  /**
   * Exécute une opération avec protection d'idempotence
   * @param key Clé unique d'idempotence
   * @param operation Fonction à exécuter
   * @param ttlSeconds Durée de vie en secondes
   * @returns Résultat de l'opération ou null si déjà traité
   */
  async withIdempotency<T>(
    key: string,
    operation: () => Promise<T>,
    ttlSeconds: number = 604800,
  ): Promise<{ result: T; alreadyProcessed: boolean } | null> {
    // Vérifier si déjà traité
    const existing = await this.isProcessed(key);
    if (existing) {
      this.logger.debug(`Operation already processed, skipping: ${key}`);
      return null;
    }

    try {
      // Exécuter l'opération
      const result = await operation();
      
      // Marquer comme traité
      await this.markAsProcessed(key, result, ttlSeconds);
      
      return { result, alreadyProcessed: false };
    } catch (error) {
      this.logger.error(`Operation failed: ${key}`, error);
      throw error;
    }
  }

  /**
   * Nettoie les clés d'idempotence expirées
   * À appeler périodiquement via un cron job
   */
  async cleanupExpired(): Promise<number> {
    try {
      // Note: Temporary type assertion until Prisma client is regenerated
      const result = await (this.prisma as any).idempotencyKey.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      
      this.logger.log(`Cleaned up ${result.count} expired idempotency keys`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to cleanup expired idempotency keys', error);
      return 0;
    }
  }
}
