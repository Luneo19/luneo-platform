import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bullmq';
import { OutboxService } from './outbox.service';

/**
 * Worker qui publie les événements de l'outbox
 * 
 * Options de publication:
 * 1. EventEmitter (local, pour compatibilité)
 * 2. Webhooks (vers URLs configurées)
 * 3. Kafka/NATS (futur)
 */
@Processor('outbox-publisher')
export class OutboxPublisherWorker {
  private readonly logger = new Logger(OutboxPublisherWorker.name);

  constructor(
    private readonly outboxService: OutboxService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Process('publish-events')
  async publishEvents(job: Job) {
    this.logger.debug('Processing outbox events...');

    const events = await this.outboxService.getPendingEvents(100);

    if (events.length === 0) {
      this.logger.debug('No pending events to publish');
      return { processed: 0 };
    }

    let successCount = 0;
    let failCount = 0;

    for (const event of events) {
      try {
        // Option 1: Publier via EventEmitter (pour compatibilité)
        this.eventEmitter.emit(event.eventType, event.payload);

        // Option 2: Publier via webhooks (si configuré)
        // await this.publishToWebhooks(event);

        // Option 3: Publier via Kafka/NATS (futur)
        // await this.publishToMessageQueue(event);

        await this.outboxService.markAsPublished(event.id);
        successCount++;

        this.logger.debug(`Published event: ${event.eventType} (${event.id})`);
      } catch (error) {
        this.logger.error(`Failed to publish event ${event.id}:`, error);

        // Si trop de tentatives, marquer comme échoué définitivement
        if (event.attempts >= 5) {
          await this.outboxService.markAsFailed(event.id, error.message);
          failCount++;
        } else {
          // Sinon, réessayer plus tard
          await this.outboxService.retry(event.id);
        }
      }
    }

    this.logger.log(
      `Outbox processing complete: ${successCount} published, ${failCount} failed`,
    );

    return {
      processed: events.length,
      success: successCount,
      failed: failCount,
    };
  }

  /**
   * Publie un événement vers les webhooks configurés (futur)
   */
  private async publishToWebhooks(event: any): Promise<void> {
    // TODO: Implémenter publication vers webhooks brand-specific
    // const brands = await this.getBrandsWithWebhooks(event.eventType);
    // for (const brand of brands) {
    //   await this.sendWebhook(brand.webhookUrl, event);
    // }
  }
}





























