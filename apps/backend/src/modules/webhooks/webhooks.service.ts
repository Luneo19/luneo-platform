import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import { createHash } from 'crypto';

export interface SendGridEventData {
  email: string;
  event: string;
  timestamp: number;
  reason?: string;
  'smtp-id'?: string;
  sg_event_id?: string;
  sg_message_id?: string;
  response?: string;
  attempt?: string;
  useragent?: string;
  ip?: string;
  url?: string;
  category?: string[];
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate idempotency key from payload
   */
  generateIdempotencyKey(payload: Record<string, unknown>, brandId: string): string {
    const payloadStr = JSON.stringify(payload);
    const hash = createHash('sha256').update(`${brandId}:${payloadStr}`).digest('hex');
    return hash.substring(0, 32);
  }

  /**
   * Validate webhook idempotency and timestamp (replay protection)
   */
  async validateWebhook(
    idempotencyKey: string,
    timestamp: number,
    maxAgeMinutes: number = 5,
  ): Promise<{ isValid: boolean; existing?: { id: string; event: string; payload: unknown; statusCode: number | null; createdAt: Date } }> {
    const existing = await this.prisma.webhookLog.findFirst({
      where: {
        payload: { path: ['idempotencyKey'], equals: idempotencyKey } as Prisma.JsonFilter,
      },
    });

    if (existing) {
      this.logger.debug(`Webhook already processed: ${idempotencyKey}`);
      return { isValid: true, existing };
    }

    const now = Date.now();
    const age = Math.abs(now - timestamp);
    const maxAge = maxAgeMinutes * 60 * 1000;

    if (age > maxAge) {
      throw new BadRequestException(
        `Webhook timestamp too old: ${age}ms > ${maxAge}ms. Possible replay attack.`,
      );
    }

    return { isValid: true };
  }

  /**
   * Process a webhook with idempotency
   */
  async processWebhook(
    brandId: string,
    event: string,
    payload: Record<string, unknown>,
    idempotencyKey?: string,
    timestamp?: number,
  ): Promise<unknown> {
    const key = idempotencyKey || this.generateIdempotencyKey(payload, brandId);
    const ts = timestamp || Date.now();

    const validation = await this.validateWebhook(key, ts);
    if (validation.existing) {
      return validation.existing;
    }

    try {
      const result = await this.processSendGridEvent(payload as unknown as SendGridEventData);

      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        include: { webhooks: { take: 1 } },
      });

      const webhookId = brand?.webhooks[0]?.id || '';

      await this.prisma.webhookLog.create({
        data: {
          webhookId: webhookId || undefined,
          event: `sendgrid.${event}`,
          payload: { ...payload, idempotencyKey: key, originalEvent: event } as Prisma.InputJsonValue,
          statusCode: 200,
          response: JSON.stringify(result),
        },
      });

      return result;
    } catch (error) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        include: { webhooks: { take: 1 } },
      });

      const webhookId = brand?.webhooks[0]?.id || '';

      await this.prisma.webhookLog.create({
        data: {
          webhookId: webhookId || undefined,
          event: `sendgrid.${event}`,
          payload: { ...payload, idempotencyKey: key, originalEvent: event } as Prisma.InputJsonValue,
          statusCode: null,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Process a SendGrid event with real DB operations.
   * Updates user email verification status, creates system notifications for bounce/spam.
   */
  async processSendGridEvent(event: SendGridEventData): Promise<{ success: boolean; action: string; email: string }> {
    const { email, event: eventType, reason } = event;
    this.logger.log(`Processing SendGrid event: ${eventType} for ${email}`);

    switch (eventType) {
      case 'delivered':
        return { success: true, action: 'email_delivered', email };

      case 'bounce': {
        // Mark user email as no longer verified (bounce = invalid address)
        const bouncedUser = await this.prisma.user.findFirst({ where: { email } });
        if (bouncedUser) {
          await this.prisma.user.update({
            where: { id: bouncedUser.id },
            data: { emailVerified: false },
          });
          // Create system notification for user about bounce
          await this.prisma.notification.create({
            data: {
              userId: bouncedUser.id,
              type: 'warning',
              title: 'Problème de livraison email',
              message: `Votre adresse ${email} a rencontré un problème de livraison${reason ? ': ' + reason : ''}. Veuillez vérifier votre adresse email.`,
            },
          }).catch(() => { /* not critical */ });
          this.logger.warn(`Email bounce for user ${bouncedUser.id}: ${reason}`);
        }
        return { success: true, action: 'email_bounced', email };
      }

      case 'spam_report': {
        // Create notification for admins about spam report
        const spamUser = await this.prisma.user.findFirst({ where: { email } });
        if (spamUser) {
          // Deactivate email for this user to prevent further spam reports
          await this.prisma.user.update({
            where: { id: spamUser.id },
            data: { emailVerified: false },
          });
          this.logger.warn(`Spam report from ${email} — user ${spamUser.id}`);
        }
        return { success: true, action: 'email_suppressed_spam', email };
      }

      case 'unsubscribe':
      case 'group_unsubscribe': {
        const unsubUser = await this.prisma.user.findFirst({ where: { email } });
        if (unsubUser) {
          // Create notification that user unsubscribed
          await this.prisma.notification.create({
            data: {
              userId: unsubUser.id,
              type: 'info',
              title: 'Désabonnement email',
              message: 'Vous avez été désabonné des emails. Vous pouvez modifier vos préférences dans les paramètres.',
            },
          }).catch(() => { /* not critical */ });
          this.logger.log(`User ${unsubUser.id} unsubscribed from emails`);
        }
        return { success: true, action: eventType === 'unsubscribe' ? 'email_unsubscribed' : 'email_group_unsubscribed', email };
      }

      case 'dropped':
        this.logger.warn(`Email dropped for ${email}: ${reason}`);
        return { success: true, action: 'email_dropped', email };

      case 'deferred':
        this.logger.log(`Email deferred for ${email}: ${reason}`);
        return { success: true, action: 'email_deferred', email };

      case 'processed':
        return { success: true, action: 'email_processed', email };

      case 'open':
        return { success: true, action: 'email_opened', email };

      case 'click':
        return { success: true, action: 'email_clicked', email };

      default:
        this.logger.warn(`Unhandled SendGrid event: ${eventType}`);
        return { success: true, action: `unhandled_${eventType}`, email };
    }
  }

  async logWebhookEvent(event: Record<string, unknown>) {
    this.logger.debug('Webhook event logged:', JSON.stringify(event, null, 2));
  }
}
