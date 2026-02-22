import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { SlackService } from './slack/slack.service';
import { ZapierService } from './zapier/zapier.service';
import { WebhookIntegrationService } from './webhook-integration/webhook-integration.service';
import { Logger } from '@nestjs/common';
import { JsonValue, JsonObject } from '@/common/types/utility-types';

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
  config: Record<string, JsonValue>;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly slackService: SlackService,
    private readonly zapierService: ZapierService,
    private readonly webhookService: WebhookIntegrationService,
  ) {}

  /**
   * Get all integrations for an organization
   */
  async getIntegrations(organizationId: string): Promise<Integration[]> {
    const cacheKey = `integrations:${organizationId}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      // In a real implementation, this would query a dedicated Integration table
      // For now, we'll return configured integrations based on organization settings
      const org = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          // @ts-expect-error V2 migration
          settings: true,
        },
      });

      if (!org) {
        throw new NotFoundException('Organization not found');
      }

      // @ts-expect-error V2 migration
      const settings = (org.settings as JsonObject | null) || {};
      const integrations: Integration[] = [];

      // Check for Slack integration
      const slackConfig = settings.slack as Record<string, JsonValue> | undefined;
      if (slackConfig && typeof slackConfig === 'object' && !Array.isArray(slackConfig) && slackConfig.enabled) {
        integrations.push({
          id: 'slack-1',
          type: IntegrationType.SLACK,
          name: 'Slack Notifications',
          config: slackConfig as Record<string, JsonValue>,
          isActive: true,
          organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Check for Zapier integration
      const zapierConfig = settings.zapier as Record<string, JsonValue> | undefined;
      if (zapierConfig && typeof zapierConfig === 'object' && !Array.isArray(zapierConfig) && zapierConfig.enabled) {
        integrations.push({
          id: 'zapier-1',
          type: IntegrationType.ZAPIER,
          name: 'Zapier Webhooks',
          config: zapierConfig as Record<string, JsonValue>,
          isActive: true,
          organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Check for Webhook integration
      const webhooksConfig = settings.webhooks as Record<string, JsonValue> | undefined;
      if (webhooksConfig && typeof webhooksConfig === 'object' && !Array.isArray(webhooksConfig) && webhooksConfig.enabled) {
        integrations.push({
          id: 'webhook-1',
          type: IntegrationType.WEBHOOK,
          name: 'Custom Webhooks',
          config: webhooksConfig as Record<string, JsonValue>,
          isActive: true,
          organizationId,
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
    organizationId: string,
    type: IntegrationType,
    config: Record<string, JsonValue>,
  ): Promise<Integration> {
    // Get current organization settings
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      // @ts-expect-error V2 migration
      select: { settings: true },
    });

    // @ts-expect-error V2 migration
    const settings = (org?.settings as JsonObject | null) || {};
    
    // Update settings with new integration
    settings[type] = {
      enabled: true,
      ...config,
      updatedAt: new Date().toISOString(),
    };

    // Update organization
    await this.prisma.organization.update({
      where: { id: organizationId },
      // @ts-expect-error V2 migration
      data: { settings },
    });

    // Clear cache
    await this.cache.delSimple(`integrations:${organizationId}`);

    // Test integration
    await this.testIntegration(organizationId, type, config);

    return {
      id: `${type}-1`,
      type,
      name: this.getIntegrationName(type),
      config,
      isActive: true,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Disable integration
   */
  async disableIntegration(organizationId: string, type: IntegrationType): Promise<void> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      // @ts-expect-error V2 migration
      select: { settings: true },
    });

    // @ts-expect-error V2 migration
    const settings = (org?.settings as JsonObject | null) || {};
    
    const integrationConfig = settings[type] as Record<string, JsonValue> | undefined;
    if (integrationConfig && typeof integrationConfig === 'object' && !Array.isArray(integrationConfig)) {
      integrationConfig.enabled = false;
      integrationConfig.disabledAt = new Date().toISOString();
      settings[type] = integrationConfig;
    }

    await this.prisma.organization.update({
      where: { id: organizationId },
      // @ts-expect-error V2 migration
      data: { settings },
    });

    await this.cache.delSimple(`integrations:${organizationId}`);
  }

  /**
   * Test integration
   */
  async testIntegration(
    organizationId: string,
    type: IntegrationType,
    config: Record<string, JsonValue>,
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
        message: error instanceof Error ? error.message : 'Integration test failed',
      };
    }
  }

  /**
   * Send notification through integrations
   */
  async sendNotification(
    organizationId: string,
    event: string,
    data: Record<string, JsonValue>,
  ): Promise<void> {
    const integrations = await this.getIntegrations(organizationId);
    
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
          this.logger.error(`Failed to send notification via ${integration.type}: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
      });

    await Promise.allSettled(promises);
  }

  /**
   * Get integration statistics
   */
  async getIntegrationStats(organizationId: string): Promise<{
    total: number;
    active: number;
    byType: Record<string, number>;
  }> {
    const integrations = await this.getIntegrations(organizationId);
    
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



