/**
 * @fileoverview Service de traitement des webhooks
 * @module WebhookProcessorService
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class WebhookProcessorService {
  private readonly logger = new Logger(WebhookProcessorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Traite un webhook reçu : parse le payload, détermine le type d'événement, route vers le handler approprié
   */
  async processWebhook(platform: string, topic: string, payload: unknown): Promise<void> {
    this.logger.log(`Processing webhook: ${platform} - ${topic}`);

    const parsed = typeof payload === 'string' ? this.safeParsePayload(payload) : payload;
    const eventType = this.normalizeEventType(topic, parsed);

    switch (eventType) {
      case 'order.created':
        await this.handleOrderCreated(platform, parsed);
        break;
      case 'product.updated':
        await this.handleProductUpdated(platform, parsed);
        break;
      case 'product.created':
        await this.handleProductUpdated(platform, parsed);
        break;
      case 'design.completed':
      case 'design.created':
        await this.handleDesignEvent(platform, eventType, parsed);
        break;
      default:
        this.logger.debug(`No specific handler for ${eventType}, webhook logged only`);
    }
  }

  private safeParsePayload(raw: string): unknown {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return { raw };
    }
  }

  private normalizeEventType(topic: string, payload: unknown): string {
    const p = payload as Record<string, unknown>;
    if (typeof p?.event === 'string') return p.event as string;
    if (typeof p?.topic === 'string') return p.topic as string;
    return topic;
  }

  private async handleOrderCreated(_platform: string, payload: unknown): Promise<void> {
    const p = payload as Record<string, unknown>;
    this.logger.log(`Handling order.created: ${p?.id ?? p?.orderId ?? 'unknown'}`);
    // Persist or sync order via Prisma when payload shape is known; for now just log
  }

  private async handleProductUpdated(_platform: string, payload: unknown): Promise<void> {
    const p = payload as Record<string, unknown>;
    this.logger.log(`Handling product.updated: ${p?.id ?? p?.productId ?? 'unknown'}`);
    // Persist or sync product via Prisma when payload shape is known; for now just log
  }

  private async handleDesignEvent(_platform: string, eventType: string, payload: unknown): Promise<void> {
    const p = payload as Record<string, unknown>;
    this.logger.log(`Handling ${eventType}: ${p?.id ?? p?.designId ?? 'unknown'}`);
  }
}
