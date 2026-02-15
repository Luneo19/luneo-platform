import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import type { Prisma } from '@prisma/client';
import { WebhookEvent } from '../dto';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Send webhook to ALL matching active webhooks for a brand.
   * Filters by event type, tracks duration, updates webhook metrics (lastCalledAt, lastStatusCode, failureCount).
   */
  async sendWebhook(
    event: WebhookEvent,
    data: Record<string, unknown>,
    brandId: string,
  ): Promise<{ success: boolean; statusCode?: number; error?: string; delivered: number }> {
    if (!brandId) {
      this.logger.error('brandId is required for webhook delivery');
      return { success: false, error: 'brandId is required', delivered: 0 };
    }

    try {
      // Find ALL active webhooks for this brand that subscribe to this event
      // Cast string event value to Prisma enum for array `has` filter
      const eventStr = event as string;
      const webhooks = await this.prisma.webhook.findMany({
        where: {
          brandId,
          isActive: true,
          events: { has: eventStr as unknown as import('@prisma/client').WebhookEvent },
        },
      });

      if (webhooks.length === 0) {
        // Fallback: try the legacy brand.webhookUrl
        const brand = await this.prisma.brand.findUnique({
          where: { id: brandId },
          select: { id: true, name: true, webhookUrl: true, webhookSecret: true },
        });
        if (!brand?.webhookUrl) {
          return { success: true, error: 'No webhook configured for this event', delivered: 0 };
        }
        // Deliver to legacy URL
        const result = await this.deliverToUrl(brand.webhookUrl, brand.webhookSecret || '', event, data, brandId, brand.name || '', null);
        return { ...result, delivered: result.success ? 1 : 0 };
      }

      // Deliver to each matching webhook
      let delivered = 0;
      let lastError: string | undefined;
      for (const webhook of webhooks) {
        const result = await this.deliverToUrl(webhook.url, webhook.secret, event, data, brandId, '', webhook.id);
        if (result.success) delivered++;
        else lastError = result.error;
      }

      return {
        success: delivered > 0 || webhooks.length === 0,
        delivered,
        error: lastError,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to send webhook for event ${event}:`, error);
      return {
        success: false,
        delivered: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Deliver a webhook payload to a specific URL with full tracking.
   */
  private async deliverToUrl(
    url: string,
    secret: string,
    event: WebhookEvent,
    data: Record<string, unknown>,
    brandId: string,
    brandName: string,
    webhookId: string | null,
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      brandId,
      ...(brandName && { brandName }),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Luneo-Webhook/1.0',
      'X-Luneo-Event': event,
      'X-Luneo-Delivery': crypto.randomUUID(),
    };

    if (secret) {
      headers['X-Luneo-Signature'] = this.generateSignature(JSON.stringify(payload), secret);
    }

    const startTime = Date.now();
    let statusCode: number | null = null;
    let error: string | null = null;
    let responseBody: string | null = null;

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, { headers, timeout: 10000 }),
      );
      statusCode = response?.status ?? null;
      responseBody = typeof response?.data === 'string' ? response.data : JSON.stringify(response?.data ?? null);
      this.logger.log(`Webhook delivered to ${url} for ${event} — HTTP ${statusCode}`);
    } catch (err: unknown) {
      statusCode = (err as { response?: { status?: number } })?.response?.status ?? null;
      error = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Webhook delivery failed to ${url} for ${event}: ${error}`);
    }

    const duration = Date.now() - startTime;
    const isSuccess = statusCode !== null && statusCode >= 200 && statusCode < 300;

    // Store delivery log
    if (webhookId) {
      await this.prisma.webhookLog.create({
        data: {
          webhookId,
          event,
          payload: payload as Prisma.InputJsonValue,
          statusCode,
          response: responseBody,
          error,
          duration,
        },
      }).catch((e) => this.logger.error('Failed to store webhook log', e));

      // Update webhook metrics
      await this.prisma.webhook.update({
        where: { id: webhookId },
        data: {
          lastCalledAt: new Date(),
          lastStatusCode: statusCode,
          failureCount: isSuccess ? 0 : { increment: 1 },
        },
      }).catch((e) => this.logger.error('Failed to update webhook metrics', e));
    } else {
      // Legacy brand-level URL — store via storeWebhookDelivery
      await this.storeWebhookDelivery(brandId, event, payload, statusCode, error);
    }

    return { success: isSuccess, statusCode: statusCode ?? undefined, error: error ?? undefined };
  }

  /**
   * Create a new webhook
   */
  async create(brandId: string, createWebhookDto: CreateWebhookDto) {
    const webhook = await this.prisma.webhook.create({
      data: {
        brandId,
        name: createWebhookDto.name,
        url: createWebhookDto.url,
        secret: createWebhookDto.secret || '',
        events: createWebhookDto.events as unknown as import('@prisma/client').WebhookEvent[],
        isActive: createWebhookDto.isActive ?? true,
      },
      include: {
        webhookLogs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    this.logger.log(`Webhook created: ${webhook.id} for brand ${brandId}`);
    return webhook;
  }

  /**
   * Find all webhooks for a brand
   */
  async findAll(brandId: string) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { brandId },
      take: 100,
      include: {
        _count: {
          select: { webhookLogs: true },
        },
        webhookLogs: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return webhooks;
  }

  /**
   * Find one webhook by ID
   */
  async findOne(id: string, brandId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, brandId },
      include: {
        webhookLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { webhookLogs: true },
        },
      },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    return webhook;
  }

  /**
   * Update webhook
   */
  async update(id: string, brandId: string, updateWebhookDto: UpdateWebhookDto) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, brandId },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    const updated = await this.prisma.webhook.update({
      where: { id },
      data: {
        ...(updateWebhookDto.name && { name: updateWebhookDto.name }),
        ...(updateWebhookDto.url && { url: updateWebhookDto.url }),
        ...(updateWebhookDto.secret !== undefined && { secret: updateWebhookDto.secret }),
        ...(updateWebhookDto.events && { events: updateWebhookDto.events as unknown as import('@prisma/client').WebhookEvent[] }),
        ...(updateWebhookDto.isActive !== undefined && { isActive: updateWebhookDto.isActive }),
      },
      include: {
        webhookLogs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    this.logger.log(`Webhook updated: ${id}`);
    return updated;
  }

  /**
   * Remove webhook
   */
  async remove(id: string, brandId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, brandId },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    await this.prisma.webhook.delete({
      where: { id },
    });

    this.logger.log(`Webhook deleted: ${id}`);
  }

  /**
   * Get webhook logs
   */
  async getWebhookLogs(
    webhookId: string,
    brandId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    // Verify webhook belongs to brand
    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, brandId },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${webhookId} not found`);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where: { webhookId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhookLog.count({
        where: { webhookId },
      }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
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

      return { success: true, statusCode: response?.status };
    } catch (error: unknown) {
      return {
        success: false,
        statusCode: (error as { response?: { status?: number } })?.response?.status,
        error: error instanceof Error ? error.message : String(error),
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
    data: { id: string; event: string; statusCode: number | null; error: string | null; createdAt: Date }[];
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
   * SECURITY FIX: Added brandId parameter to scope retry to the user's brand (prevents IDOR).
   */
  async retryWebhook(webhookId: string, brandId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Utiliser WebhookLog au lieu de Webhook
      const webhookLog = await this.prisma.webhookLog.findUnique({
        where: { id: webhookId },
        include: { webhook: { include: { brand: true } } },
      });

      if (!webhookLog || !webhookLog.webhook) {
        throw new BadRequestException('Webhook not found');
      }

      // SECURITY FIX: Verify webhook belongs to user's brand
      if (brandId && webhookLog.webhook.brandId !== brandId) {
        throw new BadRequestException('Webhook not found');
      }

      if (webhookLog.statusCode && webhookLog.statusCode >= 200 && webhookLog.statusCode < 300) {
        throw new BadRequestException('Webhook was already successful');
      }

      // Resend webhook
      const result = await this.sendWebhook(
        webhookLog.event as WebhookEvent,
        webhookLog.payload as Record<string, unknown>,
        webhookLog.webhook.brandId,
      );

      return { success: result.success, error: result.error };
    } catch (error) {
      this.logger.error('Webhook delivery failed', { error });
      return { error: 'Webhook delivery failed', success: false };
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
    payload: Record<string, unknown>,
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
          payload: payload as Prisma.InputJsonValue,
          statusCode,
          response: statusCode !== null && statusCode >= 200 && statusCode < 300 ? 'Success' : null,
          error,
        },
      });
    } catch (error) {
      this.logger.error('Failed to store webhook delivery record:', error);
    }
  }

  // ==========================================
  // PLATFORM_ADMIN methods (cross-brand access)
  // ==========================================

  /**
   * List ALL webhooks across all brands (admin only)
   */
  async findAllAdmin() {
    return this.prisma.webhook.findMany({
      take: 200,
      include: {
        brand: { select: { id: true, name: true } },
        _count: { select: { webhookLogs: true } },
        webhookLogs: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a webhook by ID (admin — no brand scoping)
   */
  async findOneAdmin(id: string) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, name: true } },
        webhookLogs: { take: 10, orderBy: { createdAt: 'desc' } },
        _count: { select: { webhookLogs: true } },
      },
    });
    if (!webhook) throw new NotFoundException(`Webhook with ID ${id} not found`);
    return webhook;
  }

  /**
   * Update any webhook (admin — no brand scoping)
   */
  async updateAdmin(id: string, updateWebhookDto: UpdateWebhookDto) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundException(`Webhook with ID ${id} not found`);

    return this.prisma.webhook.update({
      where: { id },
      data: {
        ...(updateWebhookDto.name && { name: updateWebhookDto.name }),
        ...(updateWebhookDto.url && { url: updateWebhookDto.url }),
        ...(updateWebhookDto.secret !== undefined && { secret: updateWebhookDto.secret }),
        ...(updateWebhookDto.events && { events: updateWebhookDto.events as unknown as import('@prisma/client').WebhookEvent[] }),
        ...(updateWebhookDto.isActive !== undefined && { isActive: updateWebhookDto.isActive }),
      },
      include: { webhookLogs: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
  }

  /**
   * Delete any webhook (admin — no brand scoping)
   */
  async removeAdmin(id: string) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundException(`Webhook with ID ${id} not found`);
    await this.prisma.webhook.delete({ where: { id } });
    this.logger.log(`Webhook deleted by admin: ${id}`);
  }

  /**
   * Get webhook logs (admin — no brand scoping)
   */
  async getWebhookLogsAdmin(webhookId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where: { webhookId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhookLog.count({ where: { webhookId } }),
    ]);
    return { data: logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  /**
   * Get ALL webhook delivery history (admin — cross-brand)
   */
  async getWebhookHistoryAdmin(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          event: true,
          statusCode: true,
          error: true,
          duration: true,
          createdAt: true,
          webhook: { select: { id: true, name: true, url: true, brand: { select: { name: true } } } },
        },
      }),
      this.prisma.webhookLog.count(),
    ]);
    return { data: logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}
