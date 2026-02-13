import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '@/modules/email/email.service';

@Injectable()
export class CronJobsService {
  private readonly logger = new Logger(CronJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Génère un résumé analytique hebdomadaire
   * Runs weekly on Monday at 8:00 AM
   */
  @Cron(CronExpression.EVERY_WEEK, { name: 'analytics-digest', timeZone: 'Europe/Zurich' })
  async generateAnalyticsDigest(): Promise<{
    success: boolean;
    digest: { period: { startDate: string; endDate: string; week: number }; metrics: Record<string, unknown>; generatedAt: string };
    timestamp: string;
  }> {
    try {
      this.logger.log('Cron job: analytics-digest started');

      // Calculate last week period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      // Aggregate weekly metrics
      const [designsCount, ordersCount, revenueResult, activeUsersCount] = await Promise.all([
        // Total designs created last week
        this.prisma.design.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),

        // Total orders last week
        this.prisma.order.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),

        // Total revenue last week
        this.prisma.order.aggregate({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: {
              in: ['PAID', 'DELIVERED'],
            },
          },
          _sum: {
            totalCents: true,
          },
        }),

        // Active users (users who have activity last week)
        this.prisma.user.count({
          where: {
            updatedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
      ]);

      const revenue = (revenueResult._sum.totalCents || 0) / 100; // Convert cents to euros

      // Generate digest report
      const digest = {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          week: this.getWeekNumber(startDate),
        },
        metrics: {
          designs: {
            count: designsCount,
            change: 0, // Would need previous week data to calculate
          },
          orders: {
            count: ordersCount,
            revenue,
            change: 0,
          },
          activeUsers: {
            count: activeUsersCount,
            change: 0,
          },
        },
        generatedAt: new Date().toISOString(),
      };

      // Save digest to database (if analytics_digests table exists in Prisma schema)
      // For now, we'll just log it
      this.logger.log('Analytics digest generated', {
        period: digest.period,
        metrics: digest.metrics,
      });

      // Send digest email to platform admins
      try {
        const adminUsers = await this.prisma.user.findMany({
          where: { role: 'PLATFORM_ADMIN', isActive: true },
          select: { email: true },
        });

        if (adminUsers.length > 0) {
          const digestHtml = this.buildDigestEmailHtml(digest);
          for (const admin of adminUsers) {
            await this.emailService.queueEmail({
              to: admin.email,
              subject: `📊 Luneo - Résumé hebdomadaire (Semaine ${digest.period.week})`,
              html: digestHtml,
            });
          }
          this.logger.log(`Analytics digest emails queued for ${adminUsers.length} admins`);
        }
      } catch (emailError: unknown) {
        const msg = emailError instanceof Error ? emailError.message : String(emailError);
        this.logger.warn(`Failed to queue digest emails: ${msg}`);
      }

      this.logger.log('Cron job: analytics-digest completed', {
        period: digest.period,
        metrics: digest.metrics,
      });

      return {
        success: true,
        digest,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Cron job: analytics-digest failed', error);
      throw error;
    }
  }

  /**
   * Nettoie les anciennes données
   * Runs daily at 3:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'cleanup', timeZone: 'Europe/Zurich' })
  async cleanupOldData(): Promise<{
    success: boolean;
    results: {
      expiredSessions: number;
      oldDesignVersions: number;
      oldRefreshTokens: number;
      oldNotifications: number;
      oldLogs: number;
    };
    timestamp: string;
  }> {
    try {
      this.logger.log('Cron job: cleanup started');
      const cleanupResults = {
        expiredSessions: 0,
        oldDesignVersions: 0,
        oldRefreshTokens: 0,
        oldNotifications: 0,
        oldLogs: 0,
      };

      // 1. Clean up expired refresh tokens (older than 30 days)
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count } = await this.prisma.refreshToken.deleteMany({
          where: {
            expiresAt: {
              lt: thirtyDaysAgo,
            },
          },
        });

        cleanupResults.oldRefreshTokens = count;
        this.logger.log('Cleanup: expired refresh tokens deleted', { count });
      } catch (error) {
        this.logger.error('Cleanup: failed to clean refresh tokens', error);
      }

      // 2. Clean up old design versions (keep only last 10 per design)
      try {
        const versionCounts = await this.prisma.designVersion.groupBy({
          by: ['designId'],
          where: {},
          _count: true,
        });

        const designIdsWithExcess = versionCounts
          .filter((v) => v._count > 10)
          .map((v) => v.designId);

        let totalDeleted = 0;
        if (designIdsWithExcess.length > 0) {
          const allVersions = await this.prisma.designVersion.findMany({
            where: { designId: { in: designIdsWithExcess } },
            orderBy: [{ designId: 'asc' }, { versionNumber: 'desc' }],
            select: { id: true, designId: true, versionNumber: true },
          });

          const idsToDelete: string[] = [];
          let currentDesignId: string | null = null;
          let keptInDesign = 0;
          for (const v of allVersions) {
            if (v.designId !== currentDesignId) {
              currentDesignId = v.designId;
              keptInDesign = 0;
            }
            keptInDesign++;
            if (keptInDesign > 10) {
              idsToDelete.push(v.id);
            }
          }

          if (idsToDelete.length > 0) {
            const { count } = await this.prisma.designVersion.deleteMany({
              where: { id: { in: idsToDelete } },
            });
            totalDeleted = count;
          }
        }

        cleanupResults.oldDesignVersions = totalDeleted;
        this.logger.log('Cleanup: old design versions deleted', { count: totalDeleted });
      } catch (error) {
        this.logger.error('Cleanup: failed to clean design versions', error);
      }

      // 3. Clean up old read notifications (older than 90 days)
      try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const { count } = await this.prisma.notification.deleteMany({
          where: {
            read: true,
            createdAt: {
              lt: ninetyDaysAgo,
            },
          },
        });

        cleanupResults.oldNotifications = count;
        this.logger.log('Cleanup: old notifications deleted', { count });
      } catch (error) {
        this.logger.error('Cleanup: failed to clean notifications', error);
      }

      // 4. Clean up expired refresh tokens (already done above, but mark as sessions cleanup)
      // Note: UserSession model doesn't exist in Prisma schema, we use RefreshToken for session management
      cleanupResults.expiredSessions = cleanupResults.oldRefreshTokens; // Reuse the refresh token cleanup count

      // 5. Archive old audit logs (older than 1 year)
      try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // Note: AuditLog exists in Prisma schema, check the actual field name
        const { count } = await this.prisma.auditLog.deleteMany({
          where: {
            timestamp: {
              lt: oneYearAgo,
            },
          },
        });

        cleanupResults.oldLogs = count;
        this.logger.log('Cleanup: old logs archived', { count });
      } catch (error: unknown) {
        const err = error as { code?: string };
        if (err?.code !== 'P2001' && err?.code !== 'P2025') {
          this.logger.error('Cleanup: failed to archive logs', error);
        } else {
          this.logger.debug('Cleanup: audit logs table might not exist or has different structure');
        }
      }

      this.logger.log('Cron job: cleanup completed', cleanupResults);

      return {
        success: true,
        results: cleanupResults,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Cron job: cleanup failed', error);
      throw error;
    }
  }

  /**
   * Helper function to get week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Build HTML for the weekly analytics digest email
   */
  private buildDigestEmailHtml(digest: {
    period: { startDate: string; endDate: string; week: number };
    metrics: {
      designs: { count: number };
      orders: { count: number; revenue: number };
      activeUsers: { count: number };
    };
  }): string {
    const start = new Date(digest.period.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    const end = new Date(digest.period.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    return `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #a855f7, #ec4899); padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: white; font-weight: 800;">Luneo - Rapport Hebdomadaire</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Semaine ${digest.period.week} | ${start} - ${end}</p>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: separate; border-spacing: 12px;">
            <tr>
              <td style="background: #1a1a2e; border-radius: 8px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: 800; color: #a855f7;">${digest.metrics.designs.count}</div>
                <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Designs créés</div>
              </td>
              <td style="background: #1a1a2e; border-radius: 8px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: 800; color: #22c55e;">${digest.metrics.orders.count}</div>
                <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Commandes</div>
              </td>
            </tr>
            <tr>
              <td style="background: #1a1a2e; border-radius: 8px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: 800; color: #eab308;">${digest.metrics.orders.revenue.toFixed(2)} €</div>
                <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Revenu</div>
              </td>
              <td style="background: #1a1a2e; border-radius: 8px; padding: 20px; text-align: center;">
                <div style="font-size: 32px; font-weight: 800; color: #06b6d4;">${digest.metrics.activeUsers.count}</div>
                <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Utilisateurs actifs</div>
              </td>
            </tr>
          </table>
          <div style="text-align: center; margin-top: 24px;">
            <a href="${this.configService.get('FRONTEND_URL') || 'https://luneo.app'}/dashboard/analytics" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Voir le dashboard complet</a>
          </div>
        </div>
        <div style="padding: 16px 32px; background: #111827; text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0;">Ce rapport est généré automatiquement par Luneo Platform.</p>
        </div>
      </div>
    `;
  }
}
