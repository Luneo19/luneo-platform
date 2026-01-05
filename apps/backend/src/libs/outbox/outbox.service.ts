import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface OutboxEventData {
  eventType: string;
  payload: any;
}

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Publie un événement dans l'outbox (transaction-safe)
   */
  async publish(eventType: string, payload: any): Promise<string> {
    try {
      const event = await this.prisma.outboxEvent.create({
        data: {
          eventType,
          payload: payload as any,
          status: 'pending',
        },
      });

      this.logger.debug(`Event published to outbox: ${eventType} (${event.id})`);
      return event.id;
    } catch (error) {
      this.logger.error(`Failed to publish event to outbox: ${eventType}`, error);
      throw error;
    }
  }

  /**
   * Récupère les événements en attente de publication
   */
  async getPendingEvents(limit: number = 100): Promise<any[]> {
    return this.prisma.outboxEvent.findMany({
      where: {
        status: 'pending',
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });
  }

  /**
   * Marque un événement comme publié
   */
  async markAsPublished(eventId: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });
  }

  /**
   * Marque un événement comme échoué
   */
  async markAsFailed(eventId: string, error?: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: 'failed',
        attempts: { increment: 1 },
        payload: {
          ...((await this.prisma.outboxEvent.findUnique({ where: { id: eventId } }))?.payload as object || {}),
          error: error || 'Unknown error',
        },
      },
    });
  }

  /**
   * Réessaye un événement échoué
   */
  async retry(eventId: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: 'pending',
        attempts: { increment: 1 },
      },
    });
  }

  /**
   * Nettoie les anciens événements publiés (retention policy)
   */
  async cleanup(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.outboxEvent.deleteMany({
      where: {
        status: 'published',
        publishedAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old outbox events`);
    return result.count;
  }
}






























