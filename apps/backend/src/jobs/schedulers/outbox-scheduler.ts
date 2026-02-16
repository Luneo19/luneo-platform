import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';

/**
 * Scheduler pour publier les événements de l'outbox
 * 
 * Exécute toutes les 10 secondes pour traiter les événements en attente
 */
@Injectable()
export class OutboxScheduler {
  private readonly logger = new Logger(OutboxScheduler.name);

  constructor(
    @InjectQueue('outbox-publisher') private readonly outboxQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Publie les événements de l'outbox toutes les 10 secondes
   */
  @Cron('*/10 * * * * *') // Toutes les 10 secondes
  async publishOutboxEvents() {
    try {
      // Vérifier si la queue est disponible (Redis connecté)
      if (!this.outboxQueue || !this.outboxQueue.client) {
        this.logger.warn('Outbox queue not available (Redis not connected), skipping...');
        return;
      }

      // Ajouter un job pour publier les événements
      await this.outboxQueue.add('publish-events', {}, {
        removeOnComplete: 10,
        removeOnFail: 5,
      });

      this.logger.debug('Outbox publisher job queued');
    } catch (error: unknown) {
      // Ne pas logger en erreur si c'est une erreur de connexion Redis (mode dégradé)
      const errorMessage = (error instanceof Error ? error.message : String(error)) || '';
      const isRedisError = 
        errorMessage.includes('MaxRetriesPerRequest') || 
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('Connection') ||
        errorMessage.includes('max requests limit exceeded') ||
        errorMessage.includes('ERR max requests limit exceeded') ||
        (error && typeof error === 'object' && 'name' in error && (error as { name: string }).name === 'ReplyError' && errorMessage.includes('max requests'));
      
      if (isRedisError) {
        // Mode silencieux pour éviter le spam de logs
        // this.logger.debug('Outbox queue unavailable (Redis connection/limit issue), skipping...');
        return;
      } else {
        this.logger.error('Failed to queue outbox publisher job:', error);
      }
    }
  }

  /**
   * Nettoyage des anciens événements publiés (une fois par jour à 2h du matin)
   */
  @Cron('0 2 * * *') // Tous les jours à 2h du matin
  async cleanupOldEvents() {
    try {
      const retentionDays = 30;
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const deleted = await this.prisma.outboxEvent.deleteMany({
        where: {
          status: 'published',
          publishedAt: { lt: cutoffDate },
        },
      });

      if (deleted.count > 0) {
        this.logger.log(`Outbox cleanup: deleted ${deleted.count} published event(s) older than ${retentionDays} days`);
      }

      // Also clean up permanently failed events older than retention
      const deletedFailed = await this.prisma.outboxEvent.deleteMany({
        where: {
          status: 'failed',
          updatedAt: { lt: cutoffDate },
          attempts: { gte: 5 },
        },
      });

      if (deletedFailed.count > 0) {
        this.logger.log(`Outbox cleanup: deleted ${deletedFailed.count} permanently failed event(s)`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old outbox events:', error);
    }
  }
}





















