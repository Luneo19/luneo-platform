/**
 * Engagement Calculator Service - Calculate engagement metrics from AR sessions.
 */

import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

const ENGAGED_DURATION_SEC = 30;

export interface EngagementMetrics {
  placementRate: number;
  rotationRate: number;
  screenshotRate: number;
  shareRate: number;
  avgDuration: number;
  engagedSessionsCount: number;
  totalSessions: number;
}

export interface EngagementTrendPoint {
  date: string;
  sessions: number;
  avgDuration: number;
  placementRate: number;
  screenshotRate: number;
}

@Injectable()
export class EngagementCalculatorService {
  private readonly logger = new Logger(EngagementCalculatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate engagement metrics for a session (from ARSession counters).
   */
  async calculateEngagement(sessionId: string): Promise<EngagementMetrics | null> {
    const session = await this.prisma.aRSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return null;

    const total = 1;
    const placementRate = session.placementCount > 0 ? 1 : 0;
    const rotationRate = session.rotationCount > 0 ? 1 : 0;
    const screenshotRate = session.screenshotsTaken > 0 ? 1 : 0;
    const shareRate = session.shareCount > 0 ? 1 : 0;
    const engaged = (session.duration ?? 0) >= ENGAGED_DURATION_SEC ? 1 : 0;

    return {
      placementRate,
      rotationRate,
      screenshotRate,
      shareRate,
      avgDuration: session.duration ?? 0,
      engagedSessionsCount: engaged,
      totalSessions: total,
    };
  }

  /**
   * Get engagement trends for a project over a period.
   */
  async getEngagementTrends(
    projectId: string,
    brandId: string,
    period: { from: Date; to: Date },
  ): Promise<EngagementTrendPoint[]> {
    const project = await this.prisma.aRProject.findFirst({
      where: { id: projectId, brandId },
    });
    if (!project) {
      throw new ForbiddenException('Project not found or access denied');
    }

    const sessions = await this.prisma.aRSession.findMany({
      where: {
        projectId,
        startedAt: { gte: period.from, lte: period.to },
      },
      select: {
        startedAt: true,
        duration: true,
        placementCount: true,
        screenshotsTaken: true,
      },
    });

    const byDate = new Map<string, { sessions: number; totalDuration: number; placements: number; screenshots: number }>();
    for (const s of sessions) {
      const date = s.startedAt.toISOString().slice(0, 10);
      const cur = byDate.get(date) ?? { sessions: 0, totalDuration: 0, placements: 0, screenshots: 0 };
      cur.sessions += 1;
      cur.totalDuration += s.duration ?? 0;
      cur.placements += s.placementCount;
      cur.screenshots += s.screenshotsTaken;
      byDate.set(date, cur);
    }

    return Array.from(byDate.entries())
      .map(([date, d]) => ({
        date,
        sessions: d.sessions,
        avgDuration: d.sessions > 0 ? d.totalDuration / d.sessions : 0,
        placementRate: d.sessions > 0 ? d.placements / d.sessions : 0,
        screenshotRate: d.sessions > 0 ? d.screenshots / d.sessions : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
