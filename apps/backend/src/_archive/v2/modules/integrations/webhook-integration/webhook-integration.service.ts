import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class WebhookIntegrationService {
  private readonly logger = new Logger(WebhookIntegrationService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Test webhook endpoint
   */
  async testEndpoint(config: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    try {
      if (!(config as Record<string, string>).url) {
        return {
          success: false,
          message: 'Webhook URL is required',
        };
      }

      const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Test webhook from Luneo Enterprise',
          status: 'success',
        },
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Luneo-Webhook/1.0',
        'X-Luneo-Event': 'webhook.test',
      };

      if ((config as Record<string, string>).secret) {
        headers['X-Luneo-Signature'] = this.generateSignature(
          JSON.stringify(testPayload),
          (config as Record<string, string>).secret as string,
        );
      }

      const response = await firstValueFrom(
        this.httpService.post((config as Record<string, string>).url as string, testPayload, {
          headers,
          timeout: 5000,
        }),
      );

      return {
        success: response.status >= 200 && response.status < 300,
        message: `Webhook endpoint responded with status ${response.status}`,
      };
    } catch (error) {
      this.logger.error('Webhook test failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorResponse = (error && typeof error === 'object' && 'response' in error) ? (error as { response?: { status?: number } }).response : undefined;
      return {
        success: false,
        message: errorResponse?.status 
          ? `Endpoint returned ${errorResponse.status}`
          : errorMessage || 'Failed to connect to webhook endpoint',
      };
    }
  }

  /**
   * Send webhook
   */
  async sendWebhook(
    config: Record<string, unknown>,
    event: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      if (!(config as Record<string, string>).url || !config.enabled) {
        return;
      }

      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Luneo-Webhook/1.0',
        'X-Luneo-Event': event,
      };

      if ((config as Record<string, string>).secret) {
        headers['X-Luneo-Signature'] = this.generateSignature(
          JSON.stringify(payload),
          (config as Record<string, string>).secret as string,
        );
      }

      await firstValueFrom(
        this.httpService.post((config as Record<string, string>).url as string, payload, {
          headers,
          timeout: 10000,
        }),
      );

      this.logger.log(`Webhook sent successfully for event: ${event}`);
    } catch (error) {
      this.logger.error(`Failed to send webhook for event ${event}:`, error);
      
      // In a production environment, you might want to:
      // 1. Retry with exponential backoff
      // 2. Store failed webhooks for later retry
      // 3. Alert administrators
      throw error;
    }
  }

  /**
   * Generate HMAC signature for webhook verification
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
    try {
      const expectedSignature = this.generateSignature(payload, secret);
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get webhook delivery statistics from Prisma
   */
  async getDeliveryStats(brandId: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    pending: number;
    retrying: number;
    successRate: number;
    averageResponseTime: number;
    last24h: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    try {
      // Récupérer les webhooks de la brand
      const webhooks = await this.prisma.webhook.findMany({
        where: { brandId },
        select: { id: true },
      });

      const webhookIds = webhooks.map(w => w.id);

      if (webhookIds.length === 0) {
        return {
          total: 0,
          successful: 0,
          failed: 0,
          pending: 0,
          retrying: 0,
          successRate: 0,
          averageResponseTime: 0,
          last24h: { total: 0, successful: 0, failed: 0 },
        };
      }

      // Statistiques globales par statut
      const statsByStatus = await this.prisma.webhookDelivery.groupBy({
        by: ['status'],
        where: { webhookId: { in: webhookIds } },
        _count: { id: true },
      });

      const statusCounts: Record<string, number> = {};
      for (const stat of statsByStatus) {
        statusCounts[stat.status] = stat._count.id;
      }

      const successful = statusCounts['SUCCESS'] || 0;
      const failed = statusCounts['FAILED'] || 0;
      const pending = statusCounts['PENDING'] || 0;
      const retrying = statusCounts['RETRYING'] || 0;
      const total = successful + failed + pending + retrying;

      // Temps de réponse moyen (si le champ existe)
      // Note: WebhookDelivery n'a pas de champ responseTime directement,
      // on peut le calculer à partir des logs ou créer une agrégation
      const avgResponseTime = 0; // À implémenter si le schéma le supporte

      // Statistiques des dernières 24h
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const last24hStats = await this.prisma.webhookDelivery.groupBy({
        by: ['status'],
        where: {
          webhookId: { in: webhookIds },
          createdAt: { gte: last24h },
        },
        _count: { id: true },
      });

      const last24hCounts: Record<string, number> = {};
      for (const stat of last24hStats) {
        last24hCounts[stat.status] = stat._count.id;
      }

      const last24hSuccessful = last24hCounts['SUCCESS'] || 0;
      const last24hFailed = last24hCounts['FAILED'] || 0;
      const last24hTotal = last24hSuccessful + last24hFailed + (last24hCounts['PENDING'] || 0) + (last24hCounts['RETRYING'] || 0);

      // Calculer le taux de succès
      const completedTotal = successful + failed;
      const successRate = completedTotal > 0 
        ? Math.round((successful / completedTotal) * 1000) / 10 
        : 0;

      return {
        total,
        successful,
        failed,
        pending,
        retrying,
        successRate,
        averageResponseTime: avgResponseTime,
        last24h: {
          total: last24hTotal,
          successful: last24hSuccessful,
          failed: last24hFailed,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get delivery stats:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        retrying: 0,
        successRate: 0,
        averageResponseTime: 0,
        last24h: { total: 0, successful: 0, failed: 0 },
      };
    }
  }

  /**
   * Get detailed webhook delivery history
   */
  async getDeliveryHistory(
    brandId: string,
    options: { limit?: number; offset?: number; status?: string; webhookId?: string },
  ): Promise<{
    deliveries: Array<{
      id: string;
      webhookId: string;
      eventType: string;
      status: string;
      attempts: number;
      responseCode: number | null;
      createdAt: Date;
    }>;
    total: number;
  }> {
    try {
      const webhooks = await this.prisma.webhook.findMany({
        where: { brandId },
        select: { id: true },
      });

      const webhookIds = options.webhookId 
        ? [options.webhookId]
        : webhooks.map(w => w.id);

      const where: {
        webhookId: { in: string[] };
        status?: 'PENDING' | 'RETRYING' | 'SUCCESS' | 'FAILED';
      } = { webhookId: { in: webhookIds } };
      
      if (options.status) {
        where.status = options.status as 'PENDING' | 'RETRYING' | 'SUCCESS' | 'FAILED';
      }

      const [deliveries, total] = await Promise.all([
        this.prisma.webhookDelivery.findMany({
          where,
          select: {
            id: true,
            webhookId: true,
            eventType: true,
            status: true,
            attempts: true,
            responseCode: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: options.limit || 50,
          skip: options.offset || 0,
        }),
        this.prisma.webhookDelivery.count({ where }),
      ]);

      return { deliveries, total };
    } catch (error) {
      this.logger.error('Failed to get delivery history:', error);
      return { deliveries: [], total: 0 };
    }
  }
}



