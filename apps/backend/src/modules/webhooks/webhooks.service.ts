import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Génère une clé d'idempotency à partir du payload
   */
  generateIdempotencyKey(payload: any, brandId: string): string {
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
  ): Promise<{ isValid: boolean; existing?: any }> {
    // Vérifier si déjà traité
    const existing = await this.prisma.webhook.findFirst({
      where: { idempotencyKey: idempotencyKey || undefined },
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
    payload: any,
    idempotencyKey?: string,
    timestamp?: number,
  ): Promise<any> {
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

      // Enregistrer avec idempotency key
      await this.prisma.webhook.create({
        data: {
          brandId,
          event,
          url: '', // Pas d'URL pour webhooks entrants
          payload: payload as any,
          success: true,
          idempotencyKey: key || undefined,
          timestamp: new Date(ts),
        },
      });

      return result;
    } catch (error) {
      // Enregistrer l'échec
      await this.prisma.webhook.create({
        data: {
          brandId,
          event,
          url: '',
          payload: payload as any,
          success: false,
          error: (error as Error).message,
          idempotencyKey: key || undefined,
          timestamp: new Date(ts),
        },
      });

      throw error;
    }
  }

  async processSendGridEvent(event: any) {
    this.logger.log(`Traitement de l'événement SendGrid: ${event.event} pour ${event.email}`);
    
    // Ici vous pouvez ajouter votre logique métier
    // Par exemple: mise à jour de la base de données, notifications, etc.
    
    return { success: true, event: event.event, email: event.email };
  }

  async logWebhookEvent(event: any) {
    this.logger.debug('Événement webhook loggé:', JSON.stringify(event, null, 2));
  }
}