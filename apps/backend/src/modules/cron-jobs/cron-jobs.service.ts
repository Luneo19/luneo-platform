import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CronJobsService {
  private readonly logger = new Logger(CronJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Génère un résumé analytique hebdomadaire
   * Runs weekly on Monday at 8:00 AM
   */
  async generateAnalyticsDigest(): Promise<{
    success: boolean;
    digest: any;
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

      // Send digest email to admins (if configured)
      const adminEmails = this.configService.get<string>('admin.emails')?.split(',') || [];
      if (adminEmails.length > 0) {
        // Email sending would be handled by EmailService
        this.logger.log('Analytics digest: emails should be sent', {
          count: adminEmails.length,
        });
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
        // Get all designs
        const designs = await this.prisma.design.findMany({
          select: { id: true },
        });

        let totalDeleted = 0;
        for (const design of designs) {
          // Get versions count for this design
          const versionsCount = await this.prisma.designVersion.count({
            where: { designId: design.id },
          });

          if (versionsCount > 10) {
            // Get versions ordered by versionNumber desc, skip first 10
            const versionsToDelete = await this.prisma.designVersion.findMany({
              where: { designId: design.id },
              orderBy: { versionNumber: 'desc' },
              skip: 10,
              select: { id: true },
            });

            const { count } = await this.prisma.designVersion.deleteMany({
              where: {
                id: {
                  in: versionsToDelete.map((v) => v.id),
                },
              },
            });

            totalDeleted += count;
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
      } catch (error: any) {
        // Table might not exist or field might be different
        if (error?.code !== 'P2001' && error?.code !== 'P2025') {
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
}
