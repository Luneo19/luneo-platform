import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { PrismaService } from '@/libs/prisma/prisma.service';

/** Event names for customizer webhooks */
export const CUSTOMIZER_WEBHOOK_EVENTS = {
  CONFIG_PUBLISHED: 'customizer.config.published',
  DESIGN_SAVED: 'customizer.design.saved',
  DESIGN_COMPLETED: 'customizer.design.completed',
  RENDER_COMPLETED: 'customizer.render.completed',
} as const;

/** Payload when admin publishes a config */
export interface CustomizerConfigPublishedPayload {
  brandId: string;
  customizerId: string;
  version?: number;
  publishedAt: string;
}

/** Payload when client saves a design */
export interface CustomizerDesignSavedPayload {
  brandId: string;
  sessionId: string;
  designId: string;
  customizerId: string;
  name?: string;
  userId?: string;
  savedAt: string;
}

/** Payload when client completes and adds to cart */
export interface CustomizerDesignCompletedPayload {
  brandId: string;
  sessionId: string;
  customizerId: string;
  userId?: string;
  cartData?: unknown;
  completedAt: string;
}

/** Payload when a render job finishes */
export interface CustomizerRenderCompletedPayload {
  brandId?: string;
  exportId: string;
  sessionId?: string;
  fileUrl?: string;
  format?: string;
  completedAt: string;
}

const WEBHOOK_HEADER_SIGNATURE = 'x-luneo-webhook-signature';
const WEBHOOK_HEADER_EVENT = 'x-luneo-webhook-event';
const WEBHOOK_HEADER_TIMESTAMP = 'x-luneo-webhook-timestamp';

@Injectable()
export class CustomizerWebhookEmitter {
  private readonly logger = new Logger(CustomizerWebhookEmitter.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(CUSTOMIZER_WEBHOOK_EVENTS.CONFIG_PUBLISHED)
  async onConfigPublished(payload: CustomizerConfigPublishedPayload): Promise<void> {
    await this.emitWebhook(payload.brandId, CUSTOMIZER_WEBHOOK_EVENTS.CONFIG_PUBLISHED, payload as unknown as Record<string, unknown>);
  }

  @OnEvent(CUSTOMIZER_WEBHOOK_EVENTS.DESIGN_SAVED)
  async onDesignSaved(payload: CustomizerDesignSavedPayload): Promise<void> {
    await this.emitWebhook(payload.brandId, CUSTOMIZER_WEBHOOK_EVENTS.DESIGN_SAVED, payload as unknown as Record<string, unknown>);
  }

  @OnEvent(CUSTOMIZER_WEBHOOK_EVENTS.DESIGN_COMPLETED)
  async onDesignCompleted(payload: CustomizerDesignCompletedPayload): Promise<void> {
    await this.emitWebhook(payload.brandId, CUSTOMIZER_WEBHOOK_EVENTS.DESIGN_COMPLETED, payload as unknown as Record<string, unknown>);
  }

  @OnEvent(CUSTOMIZER_WEBHOOK_EVENTS.RENDER_COMPLETED)
  async onRenderCompleted(payload: CustomizerRenderCompletedPayload): Promise<void> {
    let brandId = payload.brandId;
    if (!brandId && payload.exportId) {
      const resolved = await this.resolveBrandIdFromExport(payload.exportId);
      if (!resolved) {
        this.logger.warn(
          `Render completed webhook skipped: could not resolve brandId for export ${payload.exportId}`,
        );
        return;
      }
      brandId = resolved;
    }
    if (!brandId) {
      this.logger.warn('Render completed webhook skipped: no brandId in payload or export');
      return;
    }
    await this.emitWebhook(brandId, CUSTOMIZER_WEBHOOK_EVENTS.RENDER_COMPLETED, payload as unknown as Record<string, unknown>);
  }

  private async resolveBrandIdFromExport(exportId: string): Promise<string | null> {
    const exp = await this.prisma.customizerExport.findUnique({
      where: { id: exportId },
      select: {
        session: {
          select: {
            customizer: {
              select: { brandId: true },
            },
          },
        },
      },
    });
    return exp?.session?.customizer?.brandId ?? null;
  }

  private async emitWebhook(
    brandId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { webhookUrl: true, webhookSecret: true },
    });

    if (!brand?.webhookUrl) {
      this.logger.debug(`Brand ${brandId} has no webhookUrl; skipping webhook for ${eventType}`);
      return;
    }

    const timestamp = new Date().toISOString();
    const body = {
      event: eventType,
      timestamp,
      data: payload,
    };
    const bodyStr = JSON.stringify(body);
    const signature = brand.webhookSecret
      ? this.signPayload(bodyStr, brand.webhookSecret)
      : '';

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        [WEBHOOK_HEADER_EVENT]: eventType,
        [WEBHOOK_HEADER_TIMESTAMP]: timestamp,
      };
      if (signature) {
        headers[WEBHOOK_HEADER_SIGNATURE] = signature;
      }

      const response = await fetch(brand.webhookUrl, {
        method: 'POST',
        headers,
        body: bodyStr,
      });

      if (!response.ok) {
        this.logger.warn(
          `Webhook POST failed for ${eventType} (brand ${brandId}): ${response.status} ${response.statusText}`,
        );
        return;
      }
      this.logger.log(`Webhook emitted: ${eventType} -> ${brand.webhookUrl}`);
    } catch (err) {
      this.logger.error(
        `Webhook POST error for ${eventType} (brand ${brandId}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private signPayload(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }
}
