import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FulfillmentStatus } from '@prisma/client';
import { PCE_EVENTS } from '../../pce.constants';

export interface TrackingStatus {
  trackingNumber: string;
  carrier: string | null;
  status: string;
  deliveredAt?: Date;
  estimatedDelivery?: Date;
  events?: Array<{ date: Date; description: string }>;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  private readonly subscriptions = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  subscribe(trackingNumber: string, carrier: string): void {
    const key = `${carrier}:${trackingNumber}`;
    this.subscriptions.add(key);
    this.logger.log(`Subscribed to tracking: ${key}`);
  }

  unsubscribe(trackingNumber: string): void {
    for (const key of this.subscriptions) {
      if (key.endsWith(`:${trackingNumber}`)) {
        this.subscriptions.delete(key);
        this.logger.log(`Unsubscribed from tracking: ${key}`);
        return;
      }
    }
  }

  async getStatus(trackingNumber: string): Promise<TrackingStatus | null> {
    const fulfillment = await this.prisma.fulfillment.findFirst({
      where: { trackingNumber },
    });
    if (!fulfillment) {
      return null;
    }
    return {
      trackingNumber: fulfillment.trackingNumber ?? trackingNumber,
      carrier: fulfillment.carrier,
      status: fulfillment.status,
      deliveredAt: fulfillment.deliveredAt ?? undefined,
      estimatedDelivery: fulfillment.estimatedDelivery ?? undefined,
      events: [],
    };
  }

  handleWebhook(payload: Record<string, unknown>): void {
    this.eventEmitter.emit(PCE_EVENTS.WEBHOOK_RECEIVED, {
      source: 'tracking',
      payload,
    });
    const trackingNumber = payload.tracking_number as string | undefined;
    const status = payload.status as string | undefined;
    if (trackingNumber && status) {
      this.logger.log(`Tracking webhook: ${trackingNumber} -> ${status}`);
    }
  }

  @Cron('0 */6 * * *')
  async checkActiveShipments(): Promise<void> {
    const active = await this.prisma.fulfillment.findMany({
      where: {
        status: {
          in: [
            FulfillmentStatus.SHIPPED,
            FulfillmentStatus.IN_TRANSIT,
            FulfillmentStatus.OUT_FOR_DELIVERY,
          ],
        },
        trackingNumber: { not: null },
      },
      select: { id: true, trackingNumber: true, carrier: true, orderId: true },
    });

    for (const f of active) {
      if (f.trackingNumber) {
        this.subscribe(f.trackingNumber, f.carrier ?? 'unknown');
      }
    }

    this.logger.debug(`Tracking cron: ${active.length} active shipments`);
  }
}
