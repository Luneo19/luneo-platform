import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UsageMeteringService } from '@/modules/usage-billing/services/usage-metering.service';
import { QuotasService } from '@/modules/usage-billing/services/quotas.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { WebhooksService } from '@/modules/webhooks/webhooks.service';

/**
 * TryOnEventsService - Centralized event handler for Try-On module.
 *
 * Integrates with platform infrastructure:
 * - Usage Billing: meter sessions & screenshots, enforce quotas
 * - Webhooks: emit events for external consumers (try-on.session.completed, etc.)
 * - Notifications: alert brand admins on milestones
 * - Analytics: track try-on events for platform-wide analytics
 *
 * All methods are fire-and-forget safe (catch errors internally).
 */
@Injectable()
export class TryOnEventsService {
  private readonly logger = new Logger(TryOnEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly usageMeteringService?: UsageMeteringService,
    @Optional() private readonly quotasService?: QuotasService,
    @Optional() private readonly notificationsService?: NotificationsService,
    @Optional() private readonly webhooksService?: WebhooksService,
  ) {}

  // ========================================
  // USAGE BILLING
  // ========================================

  /**
   * Check if a brand has remaining try-on session quota.
   * Returns { allowed, remaining, limit } or allows if billing not available.
   */
  async checkSessionQuota(brandId: string): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
  }> {
    if (!this.quotasService) {
      return { allowed: true, remaining: Infinity, limit: Infinity };
    }

    try {
      const result = await this.quotasService.checkQuota(
        brandId,
        'try_on_sessions' as never,
        1,
      );
      return {
        allowed: result.allowed,
        remaining: result.remaining,
        limit: result.limit,
      };
    } catch (error) {
      this.logger.warn('Failed to check session quota, allowing by default', {
        brandId,
        error: (error as Error).message,
      });
      return { allowed: true, remaining: Infinity, limit: Infinity };
    }
  }

  /**
   * Record a try-on session usage for billing.
   */
  async meterSessionCreated(brandId: string, sessionId: string): Promise<void> {
    if (!this.usageMeteringService) return;

    try {
      await this.usageMeteringService.recordUsage(
        brandId,
        'try_on_sessions' as never,
        1,
        { sessionId },
      );
    } catch (error) {
      this.logger.warn('Failed to meter session usage', {
        brandId,
        sessionId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Record screenshot usage for billing.
   */
  async meterScreenshotsUploaded(
    brandId: string,
    sessionId: string,
    count: number,
  ): Promise<void> {
    if (!this.usageMeteringService) return;

    try {
      await this.usageMeteringService.recordUsage(
        brandId,
        'try_on_screenshots' as never,
        count,
        { sessionId },
      );
    } catch (error) {
      this.logger.warn('Failed to meter screenshot usage', {
        brandId,
        count,
        error: (error as Error).message,
      });
    }
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  /**
   * Emit a webhook event when a try-on session is completed.
   */
  async emitSessionCompleted(
    brandId: string,
    sessionData: {
      sessionId: string;
      productsTried: string[];
      screenshotsTaken: number;
      duration: number;
      converted: boolean;
      conversionAction?: string;
      renderQuality?: string;
    },
  ): Promise<void> {
    if (!this.webhooksService) return;

    try {
      await this.webhooksService.processWebhook(
        brandId,
        'try-on.session.completed',
        {
          event: 'try-on.session.completed',
          ...sessionData,
          timestamp: new Date().toISOString(),
        },
      );
    } catch (error) {
      this.logger.warn('Failed to emit session.completed webhook', {
        brandId,
        sessionId: sessionData.sessionId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Emit a webhook event when a conversion occurs from try-on.
   */
  async emitConversion(
    brandId: string,
    conversionData: {
      sessionId: string;
      productId: string;
      action: string;
      revenue?: number;
      currency?: string;
    },
  ): Promise<void> {
    if (!this.webhooksService) return;

    try {
      await this.webhooksService.processWebhook(
        brandId,
        'try-on.conversion',
        {
          event: 'try-on.conversion',
          ...conversionData,
          timestamp: new Date().toISOString(),
        },
      );
    } catch (error) {
      this.logger.warn('Failed to emit conversion webhook', {
        brandId,
        error: (error as Error).message,
      });
    }
  }

  // ========================================
  // NOTIFICATIONS
  // ========================================

  /**
   * Notify brand admin when a try-on milestone is reached.
   * Thresholds: 100, 500, 1000, 5000, 10000 sessions.
   */
  async checkAndNotifyMilestone(brandId: string): Promise<void> {
    if (!this.notificationsService) return;

    try {
      const milestones = [100, 500, 1000, 5000, 10000];

      // Count total sessions for this brand
      const totalSessions = await this.prisma.tryOnSession.count({
        where: {
          configuration: {
            project: { brandId },
          },
        },
      });

      // Check if we just hit a milestone
      const milestone = milestones.find(
        (m) => totalSessions === m || (totalSessions > m && totalSessions <= m + 5),
      );

      if (!milestone) return;

      // Find the brand admin user
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: {
          name: true,
          users: {
            where: { role: 'ADMIN' },
            select: { id: true },
            take: 1,
          },
        },
      });

      if (!brand?.users[0]) return;

      await this.notificationsService.create({
        userId: brand.users[0].id,
        type: 'success',
        title: 'Virtual Try-On Milestone!',
        message: `Félicitations ! ${brand.name} a atteint ${milestone.toLocaleString()} sessions Virtual Try-On.`,
        data: { milestone, totalSessions },
        actionUrl: '/virtual-try-on',
        actionLabel: 'Voir les analytics',
      });
    } catch (error) {
      this.logger.warn('Failed to check/notify milestone', {
        brandId,
        error: (error as Error).message,
      });
    }
  }

  // ========================================
  // HELPER: Resolve brand ID from session
  // ========================================

  /**
   * Get the brand ID associated with a try-on session.
   */
  async getBrandIdFromSession(sessionId: string): Promise<string | null> {
    try {
      const session = await this.prisma.tryOnSession.findUnique({
        where: { sessionId },
        select: {
          configuration: {
            select: {
              project: {
                select: { brandId: true },
              },
            },
          },
        },
      });
      return session?.configuration?.project?.brandId ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Get the brand ID from a configuration ID.
   */
  async getBrandIdFromConfig(configurationId: string): Promise<string | null> {
    try {
      const config = await this.prisma.tryOnConfiguration.findUnique({
        where: { id: configurationId },
        select: {
          project: {
            select: { brandId: true },
          },
        },
      });
      return config?.project?.brandId ?? null;
    } catch {
      return null;
    }
  }
}
