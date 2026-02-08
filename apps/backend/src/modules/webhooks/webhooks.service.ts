import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import { createHash } from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Génère une clé d'idempotency à partir du payload
   */
  generateIdempotencyKey(payload: Record<string, unknown>, brandId: string): string {
    const payloadStr = JSON.stringify(payload);
    const hash = createHash('sha256').update(`${brandId}:${payloadStr}`).digest('hex');
    return hash.substring(0, 32);
  }

  /**
   * Valide l'idempotency et le timestamp (replay protection)
   */
  async validateWebhook(
    idempotencyKey: string,
    timestamp: number,
    maxAgeMinutes: number = 5,
  ): Promise<{ isValid: boolean; existing?: { id: string; event: string; payload: unknown; statusCode: number | null; createdAt: Date } }> {
    // Vérifier si déjà traité (utiliser WebhookLog au lieu de Webhook)
    // Note: Le modèle Webhook n'a pas idempotencyKey, on utilise une approche alternative
    const existing = await this.prisma.webhookLog.findFirst({
      where: { 
        payload: { path: ['idempotencyKey'], equals: idempotencyKey } as Prisma.JsonFilter,
      },
    });

    if (existing) {
      this.logger.debug(`Webhook already processed: ${idempotencyKey}`);
      return { isValid: true, existing };
    }

    // Vérifier timestamp (replay protection)
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
   * Traite un webhook avec idempotency
   */
  async processWebhook(
    brandId: string,
    event: string,
    payload: Record<string, unknown>,
    idempotencyKey?: string,
    timestamp?: number,
  ): Promise<unknown> {
    // Générer idempotency key si non fourni
    const key = idempotencyKey || this.generateIdempotencyKey(payload, brandId);
    const ts = timestamp || Date.now();

    // Valider idempotency
    const validation = await this.validateWebhook(key, ts);
    if (validation.existing) {
      return validation.existing; // Déjà traité
    }

    // Traiter le webhook
    try {
      const result = await this.processSendGridEvent(payload);

      // Enregistrer avec idempotency key (utiliser WebhookLog)
      // Note: Le modèle Webhook n'a pas ces champs, on utilise WebhookLog
      // Trouver ou créer un webhook pour cette brand
      const brand = await this.prisma.brand.findUnique({ 
        where: { id: brandId },
        include: { webhooks: { take: 1 } },
      });
      
      const webhookId = brand?.webhooks[0]?.id || '';
      
      await this.prisma.webhookLog.create({
        data: {
          webhookId: webhookId || undefined,
          event: 'webhook_processed',
          payload: { ...payload, idempotencyKey: key, originalEvent: event } as Prisma.InputJsonValue,
          statusCode: 200,
          response: JSON.stringify(result),
        },
      });

      return result;
    } catch (error) {
      // Enregistrer l'échec (utiliser WebhookLog)
      const brand = await this.prisma.brand.findUnique({ 
        where: { id: brandId },
        include: { webhooks: { take: 1 } },
      });
      
      const webhookId = brand?.webhooks[0]?.id || '';
      
      await this.prisma.webhookLog.create({
        data: {
          webhookId: webhookId || undefined,
          event: 'webhook_processed',
          payload: { ...payload, idempotencyKey: key, originalEvent: event } as Prisma.InputJsonValue,
          statusCode: null,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  async processSendGridEvent(event: Record<string, unknown>) {
    this.logger.log(`Traitement de l'événement SendGrid: ${event.event} pour ${event.email}`);
    
    // Ici vous pouvez ajouter votre logique métier
    // Par exemple: mise à jour de la base de données, notifications, etc.
    
    return { success: true, event: event.event, email: event.email };
  }

  async logWebhookEvent(event: Record<string, unknown>) {
    this.logger.debug('Événement webhook loggé:', JSON.stringify(event, null, 2));
  }
}