import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

/** Delegate for idempotencyKey model (use when Prisma client does not yet include the model) */
interface IdempotencyKeyDelegate {
  findUnique: (args: { where: { key: string } }) => Promise<{ key: string } | null>;
  create: (args: {
    data: { key: string; result: string | null; expiresAt: Date };
  }) => Promise<unknown>;
  update: (args: {
    where: { key: string };
    data: { result: string | null; expiresAt: Date };
  }) => Promise<unknown>;
  upsert: (args: { where: { key: string }; create: { key: string; result: string | null; expiresAt: Date }; update: { result: string | null; expiresAt: Date } }) => Promise<unknown>;
  delete: (args: { where: { key: string } }) => Promise<unknown>;
  deleteMany: (args: { where: { expiresAt: { lt: Date } } }) => Promise<{ count: number }>;
}

/**
 * Service d'idempotence pour éviter le traitement en double des webhooks et opérations
 * Utilise une table de base de données pour stocker les clés d'idempotence
 */
@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get idempotencyKey(): IdempotencyKeyDelegate {
    return (this.prisma as unknown as { idempotencyKey: IdempotencyKeyDelegate }).idempotencyKey;
  }

  /**
   * Vérifie si une opération a déjà été traitée
   * @param key Clé unique d'idempotence (ex: webhook_event_id)
   * @returns true si déjà traité, false sinon
   */
  async isProcessed(key: string): Promise<boolean> {
    try {
      const existing = await this.idempotencyKey.findUnique({
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
  async markAsProcessed(key: string, result?: unknown, ttlSeconds: number = 604800): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      
      await this.idempotencyKey.upsert({
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
   * Acquire idempotency key atomically for "processing" phase.
   * Returns false when key already exists (already processing or already processed).
   */
  async claimForProcessing(key: string, ttlSeconds: number = 300): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      await this.idempotencyKey.create({
        data: {
          key,
          result: JSON.stringify({ status: 'PROCESSING' }),
          expiresAt,
        },
      });
      return true;
    } catch (error: unknown) {
      // Prisma unique constraint error code
      const code = (error as { code?: string })?.code;
      if (code === 'P2002') {
        return false;
      }
      this.logger.warn(`Idempotency claim failed for key ${key}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Complete an already-claimed idempotency key.
   */
  async completeProcessing(key: string, result?: unknown, ttlSeconds: number = 604800): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await this.idempotencyKey.update({
      where: { key },
      data: {
        result: result ? JSON.stringify(result) : JSON.stringify({ status: 'PROCESSED' }),
        expiresAt,
      },
    });
  }

  /**
   * Release claim on failure to allow safe retries.
   */
  async releaseClaim(key: string): Promise<void> {
    try {
      await this.idempotencyKey.delete({ where: { key } });
    } catch (error: unknown) {
      this.logger.warn(`Failed to release idempotency key ${key}: ${error instanceof Error ? error.message : String(error)}`);
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
      const result = await this.idempotencyKey.deleteMany({
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
