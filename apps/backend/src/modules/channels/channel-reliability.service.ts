import { Injectable, Logger } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { ChannelRouterService } from './channel-router.service';

interface DeliveryAttempt {
  channelType: string;
  recipientId: string;
  content: string;
  config: Record<string, unknown>;
  attempt: number;
}

interface DeadLetterItem {
  id: string;
  organizationId: string;
  channelType: string;
  recipientId: string;
  content: string;
  config: Record<string, unknown>;
  reason: string;
  failedAt: string;
}

@Injectable()
export class ChannelReliabilityService {
  private readonly logger = new Logger(ChannelReliabilityService.name);
  private readonly deadLetterQueue: DeadLetterItem[] = [];
  private readonly maxRetryAttempts = 3;

  constructor(
    private readonly channelRouterService: ChannelRouterService,
    private readonly prisma: PrismaOptimizedService,
  ) {}

  async sendWithRetry(
    organizationId: string,
    channelType: string,
    config: Record<string, unknown>,
    recipientId: string,
    content: string,
  ) {
    const attemptPayload: DeliveryAttempt = {
      channelType,
      recipientId,
      content,
      config,
      attempt: 0,
    };

    for (let i = 1; i <= this.maxRetryAttempts; i++) {
      attemptPayload.attempt = i;
      const started = Date.now();
      try {
        const result = await this.channelRouterService.routeOutgoing(
          channelType,
          config,
          recipientId,
          content,
        );
        await this.trackSlaEvent(organizationId, channelType, {
          status: 'delivered',
          attempt: i,
          latencyMs: Date.now() - started,
        });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await this.trackSlaEvent(organizationId, channelType, {
          status: 'failed',
          attempt: i,
          latencyMs: Date.now() - started,
          error: message,
        });

        if (i < this.maxRetryAttempts) {
          const backoffMs = Math.pow(2, i) * 250;
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        this.deadLetterQueue.unshift({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          organizationId,
          channelType,
          recipientId,
          content,
          config,
          reason: message,
          failedAt: new Date().toISOString(),
        });
        if (this.deadLetterQueue.length > 200) {
          this.deadLetterQueue.pop();
        }
        throw error;
      }
    }
    throw new Error('Aucune tentative d’envoi exécutée');
  }

  async getChannelSla(organizationId: string, days = 7) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: 'channel_delivery',
        createdAt: { gte: from },
      },
      select: { properties: true },
    });

    const byChannel = new Map<
      string,
      { delivered: number; failed: number; totalLatency: number; attempts: number }
    >();
    for (const e of events) {
      const props = (e.properties ?? {}) as Record<string, unknown>;
      const channel = typeof props.channelType === 'string' ? props.channelType : 'UNKNOWN';
      const status = typeof props.status === 'string' ? props.status : 'failed';
      const latency = typeof props.latencyMs === 'number' ? props.latencyMs : 0;
      const current = byChannel.get(channel) ?? {
        delivered: 0,
        failed: 0,
        totalLatency: 0,
        attempts: 0,
      };
      if (status === 'delivered') current.delivered += 1;
      if (status === 'failed') current.failed += 1;
      current.totalLatency += latency;
      current.attempts += 1;
      byChannel.set(channel, current);
    }

    return {
      periodDays: days,
      channels: [...byChannel.entries()].map(([channelType, item]) => {
        const total = item.delivered + item.failed;
        return {
          channelType,
          deliverySuccessRate:
            total > 0 ? Math.round((item.delivered / total) * 10000) / 100 : 0,
          avgLatencyMs:
            item.attempts > 0 ? Math.round(item.totalLatency / item.attempts) : 0,
          totalAttempts: item.attempts,
          delivered: item.delivered,
          failed: item.failed,
        };
      }),
      deadLetterQueueSize: this.deadLetterQueue.length,
    };
  }

  getDeadLetterQueue(organizationId: string, limit = 50) {
    return this.deadLetterQueue
      .filter((item) => item.organizationId === organizationId)
      .slice(0, Math.max(1, Math.min(limit, 200)));
  }

  async retryDeadLetterItem(organizationId: string, id: string) {
    const item = this.deadLetterQueue.find(
      (x) => x.id === id && x.organizationId === organizationId,
    );
    if (!item) {
      throw new Error('DLQ item introuvable');
    }
    await this.sendWithRetry(
      organizationId,
      item.channelType,
      item.config,
      item.recipientId,
      item.content,
    );
    const idx = this.deadLetterQueue.findIndex((x) => x.id === id);
    if (idx >= 0) this.deadLetterQueue.splice(idx, 1);
    return { retried: true };
  }

  private async trackSlaEvent(
    organizationId: string,
    channelType: string,
    payload: { status: string; attempt: number; latencyMs: number; error?: string },
  ) {
    await this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        eventType: 'channel_delivery',
        properties: {
          channelType,
          status: payload.status,
          attempt: payload.attempt,
          latencyMs: payload.latencyMs,
          error: payload.error,
        },
      },
    });
  }
}

