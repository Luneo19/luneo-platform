import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CUSTOMIZER_QUEUES } from '../visual-customizer.constants';
import { CustomizerInteractionType } from '@prisma/client';

interface AnalyticsJobData {
  customizerId: string;
  date: string; // ISO date string (YYYY-MM-DD)
}

@Processor(CUSTOMIZER_QUEUES.ANALYTICS)
export class AnalyticsWorker {
  private readonly logger = new Logger(AnalyticsWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process()
  async process(job: Job<AnalyticsJobData>) {
    const { customizerId, date } = job.data;
    const targetDate = new Date(date);
    this.logger.log(`Processing analytics job ${job.id} for customizer ${customizerId} on ${date}`);

    try {
      // Get all sessions for this customizer on this date
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const sessions = await this.prisma.customizerSession.findMany({
        where: {
          customizerId,
          startedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          interactions: true,
        },
      });

      // Get all interactions for this customizer on this date
      const interactions = await this.prisma.customizerInteraction.findMany({
        where: {
          session: {
            customizerId,
            startedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
        include: {
          session: {
            select: {
              userId: true,
              anonymousId: true,
            },
          },
        },
      });

      // Calculate session metrics
      const uniqueUsers = new Set(sessions.map((s) => s.userId || s.anonymousId).filter(Boolean));
      const sessionDurations = sessions
        .map((s) => {
          if (s.startedAt && s.completedAt) {
            return s.completedAt.getTime() - s.startedAt.getTime();
          }
          return null;
        })
        .filter((d): d is number => d !== null);
      const avgSessionDuration = sessionDurations.length > 0
        ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
        : 0;

      // Count interactions by type
      const interactionCounts: Record<string, number> = {};
      let textEdits = 0;
      let imageUploads = 0;
      let clipartAdded = 0;
      let shapesAdded = 0;
      let presetsApplied = 0;

      for (const interaction of interactions) {
        interactionCounts[interaction.type] = (interactionCounts[interaction.type] || 0) + 1;

        if (interaction.type === 'TEXT_EDIT') {
          textEdits++;
        } else if (interaction.type === 'IMAGE_UPLOAD') {
          imageUploads++;
        } else if (interaction.type === 'CLIPART_ADD') {
          clipartAdded++;
        } else if (interaction.type === 'SHAPE_ADD') {
          shapesAdded++;
        } else if (interaction.type === 'PRESET_APPLY') {
          presetsApplied++;
        }
      }

      // Count conversions
      const designsSaved = interactionCounts['SAVE_DESIGN'] || 0;
      const exportsCreated = interactionCounts['EXPORT_ACTION'] || 0;
      const addToCarts = interactionCounts['ADD_TO_CART'] || 0;
      const purchases = interactionCounts['PURCHASE'] || 0;
      const shares = interactionCounts['SHARE_ACTION'] || 0;

      // Calculate revenue (simplified - would need to join with orders)
      const revenue = 0; // TODO: Calculate from actual orders
      const avgOrderValue = purchases > 0 ? revenue / purchases : 0;

      // Calculate performance metrics
      const loadTimes = interactions
        .filter((i) => i.type === 'SESSION_START' && i.durationMs)
        .map((i) => i.durationMs!);
      const avgLoadTime = loadTimes.length > 0
        ? Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length)
        : null;
      const errorCount = interactionCounts['ERROR'] || 0;

      // Upsert analytics record
      await this.prisma.customizerAnalytics.upsert({
        where: {
          customizerId_date: {
            customizerId,
            date: targetDate,
          },
        },
        create: {
          customizerId,
          date: targetDate,
          sessions: sessions.length,
          uniqueUsers: uniqueUsers.size,
          avgSessionDuration,
          totalInteractions: interactions.length,
          textEdits,
          imageUploads,
          clipartAdded,
          shapesAdded,
          presetsApplied,
          designsSaved,
          exportsCreated,
          addToCarts,
          purchases,
          shares,
          revenue,
          avgOrderValue,
          avgLoadTime,
          errorCount,
        },
        update: {
          sessions: sessions.length,
          uniqueUsers: uniqueUsers.size,
          avgSessionDuration,
          totalInteractions: interactions.length,
          textEdits,
          imageUploads,
          clipartAdded,
          shapesAdded,
          presetsApplied,
          designsSaved,
          exportsCreated,
          addToCarts,
          purchases,
          shares,
          revenue,
          avgOrderValue,
          avgLoadTime,
          errorCount,
        },
      });

      // Aggregate tool usage
      const toolUsage: Record<string, { count: number; users: Set<string>; totalTime: number }> = {};

      for (const interaction of interactions) {
        if (interaction.toolUsed) {
          if (!toolUsage[interaction.toolUsed]) {
            toolUsage[interaction.toolUsed] = {
              count: 0,
              users: new Set(),
              totalTime: 0,
            };
          }
          toolUsage[interaction.toolUsed].count++;
          const sessionUserId = interaction.session?.userId;
          if (sessionUserId) {
            toolUsage[interaction.toolUsed].users.add(sessionUserId);
          }
          if (interaction.durationMs) {
            toolUsage[interaction.toolUsed].totalTime += interaction.durationMs;
          }
        }
      }

      // Upsert tool analytics
      for (const [toolName, usage] of Object.entries(toolUsage)) {
        await this.prisma.customizerToolAnalytics.upsert({
          where: {
            customizerId_date_toolName: {
              customizerId,
              date: targetDate,
              toolName,
            },
          },
          create: {
            customizerId,
            date: targetDate,
            toolName,
            usageCount: usage.count,
            uniqueUsers: usage.users.size,
            avgTimeSpent: usage.count > 0 ? Math.round(usage.totalTime / usage.count) : 0,
          },
          update: {
            usageCount: usage.count,
            uniqueUsers: usage.users.size,
            avgTimeSpent: usage.count > 0 ? Math.round(usage.totalTime / usage.count) : 0,
          },
        });
      }

      this.logger.log(`Analytics job ${job.id} completed successfully`);
      return {
        success: true,
        sessions: sessions.length,
        interactions: interactions.length,
        tools: Object.keys(toolUsage).length,
      };
    } catch (error) {
      this.logger.error(`Analytics job ${job.id} failed: ${error}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Analytics job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Analytics job ${job.id} failed: ${error.message}`, error.stack);
  }
}
