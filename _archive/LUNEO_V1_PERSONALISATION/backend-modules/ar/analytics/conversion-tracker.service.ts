/**
 * Conversion Tracker Service - Track AR conversions and funnel.
 */

import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface ConversionFunnelStage {
  stage: string;
  count: number;
  rate?: number;
}

export interface ConversionFunnelResult {
  stages: ConversionFunnelStage[];
  conversionRate: number;
  totalRevenue: number;
}

@Injectable()
export class ConversionTrackerService {
  private readonly logger = new Logger(ConversionTrackerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Track a conversion event (update session and optionally funnel).
   */
  async trackConversion(sessionId: string, action: string, value?: number): Promise<void> {
    const session = await this.prisma.aRSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return;

    await this.prisma.aRSession.update({
      where: { id: sessionId },
      data: {
        conversionAction: action,
        ...(value != null && { conversionValue: value }),
      },
    });
    this.logger.debug(`Conversion tracked: session=${sessionId} action=${action}`);
  }

  /**
   * Get conversion funnel for project over period (from ARConversionFunnel + ARSession aggregates).
   */
  async getConversionFunnel(
    projectId: string,
    brandId: string,
    period: { from: Date; to: Date },
  ): Promise<ConversionFunnelResult> {
    const project = await this.prisma.aRProject.findFirst({
      where: { id: projectId, brandId },
    });
    if (!project) {
      throw new ForbiddenException('Project not found or access denied');
    }

    const funnelRows = await this.prisma.aRConversionFunnel.findMany({
      where: {
        projectId,
        date: { gte: period.from, lte: period.to },
      },
      orderBy: { date: 'asc' },
    });

    let qrScans = 0;
    let arLaunches = 0;
    let modelPlacements = 0;
    let engagedSessions = 0;
    let screenshots = 0;
    let shares = 0;
    let addToCarts = 0;
    let purchases = 0;
    let totalRevenue = 0;

    for (const row of funnelRows) {
      qrScans += row.qrScans;
      arLaunches += row.arLaunches;
      modelPlacements += row.modelPlacements;
      engagedSessions += row.engagedSessions;
      screenshots += row.screenshots;
      shares += row.shares;
      addToCarts += row.addToCarts;
      purchases += row.purchases;
      totalRevenue += row.totalRevenue;
    }

    const stages: ConversionFunnelStage[] = [
      { stage: 'qrScans', count: qrScans },
      { stage: 'arLaunches', count: arLaunches },
      { stage: 'modelPlacements', count: modelPlacements },
      { stage: 'engagedSessions', count: engagedSessions },
      { stage: 'screenshots', count: screenshots },
      { stage: 'shares', count: shares },
      { stage: 'addToCarts', count: addToCarts },
      { stage: 'purchases', count: purchases },
    ];

    let prev = qrScans;
    for (const s of stages) {
      if (prev > 0) s.rate = s.count / prev;
      prev = s.count;
    }

    const conversionRate = arLaunches > 0 ? purchases / arLaunches : 0;

    return {
      stages,
      conversionRate,
      totalRevenue,
    };
  }

  /**
   * Get overall conversion rate for project (from sessions).
   */
  async getConversionRate(
    projectId: string,
    brandId: string,
    period: { from: Date; to: Date },
  ): Promise<number> {
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
      select: { conversionAction: true },
    });
    const withConversion = sessions.filter((s) => s.conversionAction != null).length;
    return sessions.length > 0 ? withConversion / sessions.length : 0;
  }
}
