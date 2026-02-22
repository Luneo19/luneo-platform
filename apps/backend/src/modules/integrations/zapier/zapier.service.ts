// @ts-nocheck
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { ZapierTrigger } from './dto/zapier-subscribe.dto';
import { ZapierCreateDesignDto, ZapierUpdateProductDto } from './dto/zapier-action.dto';

export const ZAPIER_ACTIONS = ['create_design', 'update_product'] as const;
export type ZapierAction = (typeof ZAPIER_ACTIONS)[number];

@Injectable()
export class ZapierService {
  private readonly logger = new Logger(ZapierService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Test Zapier webhook
   */
  async testWebhook(config: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    try {
      if (!(config as Record<string, string>).webhookUrl) {
        return {
          success: false,
          message: 'Zapier webhook URL is required',
        };
      }

      const testPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Test de connexion Zapier depuis Luneo Enterprise',
          status: 'success',
        },
      };

      const response = await firstValueFrom(
        this.httpService.post((config as Record<string, string>).webhookUrl as string, testPayload, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Luneo-Zapier/1.0',
          },
          timeout: 5000,
        }),
      );

      return {
        success: response.status === 200,
        message: 'Zapier webhook connection successful',
      };
    } catch (error) {
      this.logger.error('Zapier test failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to connect to Zapier',
      };
    }
  }

  /**
   * Trigger Zapier Zap (legacy: single config)
   */
  async triggerZap(
    config: Record<string, unknown>,
    event: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      if (!(config as Record<string, string>).webhookUrl || !config.enabled) {
        return;
      }

      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data: this.transformDataForZapier(event, data),
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Luneo-Zapier/1.0',
      };

      if ((config as Record<string, string>).secret) {
        headers['X-Luneo-Signature'] = this.generateSignature(
          JSON.stringify(payload),
          (config as Record<string, string>).secret as string,
        );
      }

      await firstValueFrom(
        this.httpService.post((config as Record<string, string>).webhookUrl as string, payload, {
          headers,
          timeout: 10000,
        }),
      );

      this.logger.log(`Zapier zap triggered for event: ${event}`);
    } catch (error) {
      this.logger.error(`Failed to trigger Zapier zap for event ${event}:`, error);
      throw error;
    }
  }

  /** Register a webhook subscription (Zapier subscribe) */
  async registerWebhook(brandId: string, event: ZapierTrigger, targetUrl: string) {
    const sub = await this.prisma.webhookSubscription.create({
      data: { brandId, event, targetUrl, isActive: true },
    });
    this.logger.log(`Zapier webhook registered: brand=${brandId} event=${event} id=${sub.id}`);
    return sub;
  }

  /** Remove a webhook subscription */
  async unregisterWebhook(brandId: string, webhookId: string) {
    const deleted = await this.prisma.webhookSubscription.deleteMany({
      where: { id: webhookId, brandId },
    });
    if (deleted.count === 0) {
      throw new BadRequestException('Webhook subscription not found or already removed');
    }
    this.logger.log(`Zapier webhook unregistered: brand=${brandId} id=${webhookId}`);
  }

  /** Send event to all registered webhooks for this brand and event (Zapier triggers) */
  async triggerEvent(brandId: string, event: ZapierTrigger, data: Record<string, unknown>): Promise<void> {
    const subs = await this.prisma.webhookSubscription.findMany({
      where: { brandId, event, isActive: true },
    });
    if (subs.length === 0) return;

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data: this.transformDataForZapier(event, data),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Luneo-Zapier/1.0',
    };

    await Promise.allSettled(
      subs.map((sub) =>
        firstValueFrom(
          this.httpService.post(sub.targetUrl, payload, { headers, timeout: 10000 }),
        ).catch((err) => {
          this.logger.warn(`Zapier trigger failed for subscription ${sub.id}: ${err.message}`);
        }),
      ),
    );
    this.logger.log(`Zapier triggerEvent: brand=${brandId} event=${event} sent to ${subs.length} subscription(s)`);
  }

  /** Get brand info for auth test */
  async getBrandInfo(brandId: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true, name: true, slug: true },
    });
    return brand;
  }

  /** List active subscriptions for a brand */
  async listSubscriptions(brandId: string) {
    return this.prisma.webhookSubscription.findMany({
      where: { brandId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Execute an action from Zapier */
  async performAction(brandId: string, action: ZapierAction, data: ZapierCreateDesignDto | ZapierUpdateProductDto): Promise<Record<string, unknown>> {
    switch (action) {
      case 'create_design': {
        const dto = data as ZapierCreateDesignDto;
        const product = await this.prisma.product.findFirst({
          where: { id: dto.productId, brandId, isActive: true },
        });
        if (!product) throw new BadRequestException('Product not found or not active');
        const design = await this.prisma.design.create({
          data: {
            name: dto.name ?? `Zapier design ${new Date().toISOString().slice(0, 10)}`,
            prompt: dto.prompt,
            status: 'PENDING',
            productId: dto.productId,
            brandId,
            options: (dto.customizationData ?? {}) as import('@prisma/client').Prisma.InputJsonValue,
          },
          select: { id: true, name: true, status: true, productId: true, createdAt: true },
        });
        return design;
      }
      case 'update_product': {
        const dto = data as ZapierUpdateProductDto;
        const product = await this.prisma.product.findFirst({
          where: { id: dto.productId, brandId },
        });
        if (!product) throw new BadRequestException('Product not found');
        const updateData: Record<string, unknown> = {};
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.price !== undefined) updateData.price = dto.price;
        if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
        const updated = await this.prisma.product.update({
          where: { id: dto.productId },
          data: updateData,
          select: { id: true, name: true, description: true, price: true, isActive: true, updatedAt: true },
        });
        return updated;
      }
      default:
        throw new BadRequestException(`Unknown action: ${action}`);
    }
  }

  /** Return sample payload for a trigger (Zapier expects array for polling/trigger sample) */
  getTriggerSample(event: ZapierTrigger): Record<string, unknown>[] {
    const samples: Record<ZapierTrigger, Record<string, unknown>[]> = {
      new_design: [{
        id: 'sample_design_id',
        name: 'Sample Design',
        status: 'COMPLETED',
        productId: 'sample_product_id',
        brandId: 'sample_brand_id',
        createdAt: new Date().toISOString(),
      }],
      new_order: [{
        id: 'sample_order_id',
        orderNumber: 'ORD-SAMPLE-001',
        totalCents: 9999,
        status: 'CREATED',
        brandId: 'sample_brand_id',
        createdAt: new Date().toISOString(),
      }],
      new_subscription: [{
        brandId: 'sample_brand_id',
        stripeSubscriptionId: 'sub_sample',
        plan: 'professional',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      }],
      design_updated: [{
        id: 'sample_design_id',
        name: 'Updated Design',
        status: 'COMPLETED',
        productId: 'sample_product_id',
        brandId: 'sample_brand_id',
        updatedAt: new Date().toISOString(),
      }],
    };
    return samples[event] ?? [];
  }

  getAvailableTriggers(): Array<{ key: string; name: string; description: string }> {
    return [
      { key: 'new_design', name: 'New Design', description: 'Triggered when a new design is created' },
      { key: 'new_order', name: 'New Order', description: 'Triggered when a new order is placed' },
      { key: 'new_subscription', name: 'New Subscription', description: 'Triggered when a new subscription is created' },
      { key: 'design_updated', name: 'Design Updated', description: 'Triggered when a design is updated' },
    ];
  }

  getAvailableActions(): Array<{ key: ZapierAction; name: string; description: string }> {
    return [
      { key: 'create_design', name: 'Create Design', description: 'Create a new design' },
      { key: 'update_product', name: 'Update Product', description: 'Update a product' },
    ];
  }

  private transformDataForZapier(event: string, data: Record<string, unknown>): Record<string, unknown> {
    const flatData: Record<string, unknown> = {};
    const flatten = (obj: Record<string, unknown>, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (value && typeof value === "object" && !Array.isArray(value)) {
          flatten(value as Record<string, unknown>, newKey);
        } else {
          flatData[newKey] = value;
        }
      }
    };
    flatten(data);
    return flatData;
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }
}
