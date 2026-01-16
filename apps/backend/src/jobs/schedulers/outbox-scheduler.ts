import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';

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
    } catch (error: any) {
      // Ne pas logger en erreur si c'est une erreur de connexion Redis (mode dégradé)
      const errorMessage = error?.message || error?.toString() || '';
      const isRedisError = 
        errorMessage.includes('MaxRetriesPerRequest') || 
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('Connection') ||
        errorMessage.includes('max requests limit exceeded') ||
        errorMessage.includes('ERR max requests limit exceeded') ||
        (error?.name === 'ReplyError' && errorMessage.includes('max requests'));
      
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
      // Le cleanup sera géré par OutboxService.cleanup()
      // Appelé via un job séparé si nécessaire
      this.logger.log('Outbox cleanup scheduled (to be implemented)');
    } catch (error) {
      this.logger.error('Failed to cleanup old outbox events:', error);
    }
  }
}





















