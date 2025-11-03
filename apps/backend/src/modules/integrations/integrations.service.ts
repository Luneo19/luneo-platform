import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { SlackService } from './slack/slack.service';
import { ZapierService } from './zapier/zapier.service';
import { WebhookIntegrationService } from './webhook-integration/webhook-integration.service';

export enum IntegrationType {
  SLACK = 'slack',
  ZAPIER = 'zapier',
  WEBHOOK = 'webhook',
  DISCORD = 'discord',
  TEAMS = 'teams',
  EMAIL = 'email',
}

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  config: Record<string, any>;
  isActive: boolean;
  brandId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly slackService: SlackService,
    private readonly zapierService: ZapierService,
    private readonly webhookService: WebhookIntegrationService,
  ) {}

  /**
   * Get all integrations for a brand
   */
  async getIntegrations(brandId: string): Promise<Integration[]> {
    const cacheKey = `integrations:${brandId}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      // In a real implementation, this would query a dedicated Integration table
      // For now, we'll return configured integrations based on brand settings
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: {
          id: true,
          name: true,
          settings: true,
        },
      });

      if (!brand) {
        throw new NotFoundException('Brand not found');
      }

      const settings = (brand.settings as any) || {};
      const integrations: Integration[] = [];

      // Check for Slack integration
      if (settings.slack?.enabled) {
        integrations.push({
          id: 'slack-1',
          type: IntegrationType.SLACK,
          name: 'Slack Notifications',
          config: settings.slack,
          isActive: true,
          brandId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Check for Zapier integration
      if (settings.zapier?.enabled) {
        integrations.push({
          id: 'zapier-1',
          type: IntegrationType.ZAPIER,
          name: 'Zapier Webhooks',
          config: settings.zapier,
          isActive: true,
          brandId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Check for Webhook integration
      if (settings.webhooks?.enabled) {
        integrations.push({
          id: 'webhook-1',
          type: IntegrationType.WEBHOOK,
          name: 'Custom Webhooks',
          config: settings.webhooks,
          isActive: true,
          brandId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return integrations;
    }, 300); // Cache for 5 minutes
  }

  /**
   * Enable integration
   */
  async enableIntegration(
    brandId: string,
    type: IntegrationType,
    config: Record<string, any>,
  ): Promise<Integration> {
    // Get current brand settings
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { settings: true },
    });

    const settings = (brand?.settings as any) || {};
    
    // Update settings with new integration
    settings[type] = {
      enabled: true,
      ...config,
      updatedAt: new Date().toISOString(),
    };

    // Update brand
    await this.prisma.brand.update({
      where: { id: brandId },
      data: { settings },
    });

    // Clear cache
    await this.cache.delSimple(`integrations:${brandId}`);

    // Test integration
    await this.testIntegration(brandId, type, config);

    return {
      id: `${type}-1`,
      type,
      name: this.getIntegrationName(type),
      config,
      isActive: true,
      brandId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Disable integration
   */
  async disableIntegration(brandId: string, type: IntegrationType): Promise<void> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { settings: true },
    });

    const settings = (brand?.settings as any) || {};
    
    if (settings[type]) {
      settings[type].enabled = false;
      settings[type].disabledAt = new Date().toISOString();
    }

    await this.prisma.brand.update({
      where: { id: brandId },
      data: { settings },
    });

    await this.cache.delSimple(`integrations:${brandId}`);
  }

  /**
   * Test integration
   */
  async testIntegration(
    brandId: string,
    type: IntegrationType,
    config: Record<string, any>,
  ): Promise<{ success: boolean; message: string }> {
    try {
      switch (type) {
        case IntegrationType.SLACK:
          return await this.slackService.testConnection(config);
        case IntegrationType.ZAPIER:
          return await this.zapierService.testWebhook(config);
        case IntegrationType.WEBHOOK:
          return await this.webhookService.testEndpoint(config);
        default:
          throw new BadRequestException('Unsupported integration type');
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Integration test failed',
      };
    }
  }

  /**
   * Send notification through integrations
   */
  async sendNotification(
    brandId: string,
    event: string,
    data: Record<string, any>,
  ): Promise<void> {
    const integrations = await this.getIntegrations(brandId);
    
    const promises = integrations
      .filter(i => i.isActive)
      .map(async integration => {
        try {
          switch (integration.type) {
            case IntegrationType.SLACK:
              await this.slackService.sendMessage(integration.config, event, data);
              break;
            case IntegrationType.ZAPIER:
              await this.zapierService.triggerZap(integration.config, event, data);
              break;
            case IntegrationType.WEBHOOK:
              await this.webhookService.sendWebhook(integration.config, event, data);
              break;
          }
        } catch (error) {
          console.error(`Failed to send notification via ${integration.type}:`, error);
        }
      });

    await Promise.allSettled(promises);
  }

  /**
   * Get integration statistics
   */
  async getIntegrationStats(brandId: string): Promise<{
    total: number;
    active: number;
    byType: Record<string, number>;
  }> {
    const integrations = await this.getIntegrations(brandId);
    
    const byType: Record<string, number> = {};
    integrations.forEach(i => {
      byType[i.type] = (byType[i.type] || 0) + 1;
    });

    return {
      total: integrations.length,
      active: integrations.filter(i => i.isActive).length,
      byType,
    };
  }

  private getIntegrationName(type: IntegrationType): string {
    const names: Record<IntegrationType, string> = {
      [IntegrationType.SLACK]: 'Slack Notifications',
      [IntegrationType.ZAPIER]: 'Zapier Webhooks',
      [IntegrationType.WEBHOOK]: 'Custom Webhooks',
      [IntegrationType.DISCORD]: 'Discord Notifications',
      [IntegrationType.TEAMS]: 'Microsoft Teams',
      [IntegrationType.EMAIL]: 'Email Notifications',
    };
    return names[type] || type;
  }
}



