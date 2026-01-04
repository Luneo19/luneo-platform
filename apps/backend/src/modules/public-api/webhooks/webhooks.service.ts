import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { WebhookEvent } from '../dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Send webhook to brand's webhook URL
   */
  async sendWebhook(
    event: WebhookEvent,
    data: Record<string, any>,
    brandId?: string,
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    try {
      // Get brand webhook configuration
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId || (global as any).currentBrandId },
        select: {
          id: true,
          name: true,
          webhookUrl: true,
          webhookSecret: true,
        },
      });

      if (!brand || !brand.webhookUrl) {
        this.logger.warn(`No webhook URL configured for brand ${brandId}`);
        return { success: false, error: 'No webhook URL configured' };
      }

      // Prepare webhook payload
      const payload = {
        event,
        data,
        timestamp: new Date().toISOString(),
        brandId: brand.id,
        brandName: brand.name,
      };

      // Generate signature if secret is configured
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Luneo-Webhook/1.0',
      };

      if (brand.webhookSecret) {
        const signature = this.generateSignature(JSON.stringify(payload), brand.webhookSecret);
        headers['X-Luneo-Signature'] = signature;
      }

      // Send webhook
      const response = await firstValueFrom(
        this.httpService.post(brand.webhookUrl, payload, {
          headers,
          timeout: 10000, // 10 seconds timeout
        }),
      );

      this.logger.log(`Webhook sent successfully to ${brand.webhookUrl} for event ${event}`);
      
      // Store webhook delivery record
      await this.storeWebhookDelivery(brand.id, event, payload, (response as any).status, null);

      return { success: true, statusCode: (response as any).status };
    } catch (error) {
      this.logger.error(`Failed to send webhook for event ${event}:`, error);
      
      // Store failed webhook delivery
      await this.storeWebhookDelivery(
        brandId || (global as any).currentBrandId,
        event,
        data,
        null,
        error.message,
      );

      return {
        success: false,
        statusCode: error.response?.status,
        error: error.message,
      };
    }
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(brandId: string, webhookUrl: string, secret?: string): Promise<{
    success: boolean;
    statusCode?: number;
    error?: string;
  }> {
    try {
      const testPayload = {
        event: 'test',
        data: {
          message: 'This is a test webhook from Luneo',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        brandId,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Luneo-Webhook/1.0',
      };

      if (secret) {
        const signature = this.generateSignature(JSON.stringify(testPayload), secret);
        headers['X-Luneo-Signature'] = signature;
      }

      const response = await firstValueFrom(
        this.httpService.post(webhookUrl, testPayload, {
          headers,
          timeout: 10000,
        }),
      );

      return { success: true, statusCode: (response as any).status };
    } catch (error) {
      return {
        success: false,
        statusCode: error.response?.status,
        error: error.message,
      };
    }
  }

  /**
   * Get webhook delivery history
   */
  async getWebhookHistory(
    brandId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const skip = (page - 1) * limit;

    // Utiliser WebhookLog au lieu de Webhook car Webhook n'a pas ces champs
    const [webhooks, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where: { 
          webhook: { brandId },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          event: true,
          statusCode: true,
          error: true,
          createdAt: true,
        },
      }),
      this.prisma.webhookLog.count({ 
        where: { 
          webhook: { brandId },
        },
      }),
    ]);

    return {
      data: webhooks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retry failed webhook
   */
  async retryWebhook(webhookId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Utiliser WebhookLog au lieu de Webhook
      const webhookLog = await this.prisma.webhookLog.findUnique({
        where: { id: webhookId },
        include: { webhook: { include: { brand: true } } },
      });

      if (!webhookLog || !webhookLog.webhook) {
        throw new BadRequestException('Webhook not found');
      }

      if (webhookLog.statusCode && webhookLog.statusCode >= 200 && webhookLog.statusCode < 300) {
        throw new BadRequestException('Webhook was already successful');
      }

      // Resend webhook
      const result = await this.sendWebhook(
        webhookLog.event as WebhookEvent,
        webhookLog.payload as Record<string, any>,
        webhookLog.webhook.brandId,
      );

      return { success: result.success, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate webhook signature
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  }

  /**
   * Store webhook delivery record
   */
  private async storeWebhookDelivery(
    brandId: string,
    event: string,
    payload: any,
    statusCode: number | null,
    error: string | null,
  ): Promise<void> {
    try {
      // Trouver ou créer le webhook pour cette brand
      const brand = await this.prisma.brand.findUnique({ 
        where: { id: brandId },
        include: { webhooks: { take: 1 } },
      });

      if (!brand) {
        this.logger.error(`Brand ${brandId} not found`);
        return;
      }

      // Utiliser le premier webhook existant ou créer un nouveau
      let webhook = brand.webhooks[0];
      if (!webhook) {
        webhook = await this.prisma.webhook.create({
          data: {
            brandId,
            name: `Auto-created webhook for ${brand.name}`,
            url: brand.webhookUrl || '',
            secret: brand.webhookSecret || '',
            isActive: true,
          },
        });
      }

      // Créer le log
      await this.prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: payload as any,
          statusCode,
          response: statusCode !== null && statusCode >= 200 && statusCode < 300 ? 'Success' : null,
          error,
        },
      });
    } catch (error) {
      this.logger.error('Failed to store webhook delivery record:', error);
    }
  }
}
