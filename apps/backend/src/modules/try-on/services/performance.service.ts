import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface PerformanceMetricInput {
  fps: number;
  detectionLatencyMs: number;
  renderLatencyMs: number;
  gpuInfo?: string;
  deviceType: string;
  browserInfo?: string;
}

export interface DevicePerformanceSummary {
  deviceType: string;
  avgFps: number;
  avgDetectionLatency: number;
  avgRenderLatency: number;
  sampleCount: number;
  recommendedQuality: 'high' | 'medium' | 'low' | '2d_fallback';
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a performance metric sample for a session.
   */
  async recordMetric(sessionId: string, metric: PerformanceMetricInput) {
    const session = await this.prisma.tryOnSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const created = await this.prisma.tryOnPerformanceMetric.create({
      data: {
        sessionId: session.id,
        fps: Math.round(metric.fps),
        detectionLatencyMs: Math.round(metric.detectionLatencyMs),
        renderLatencyMs: Math.round(metric.renderLatencyMs),
        gpuInfo: metric.gpuInfo || null,
        deviceType: metric.deviceType,
        browserInfo: metric.browserInfo || null,
      },
      select: {
        id: true,
        fps: true,
        detectionLatencyMs: true,
        renderLatencyMs: true,
        createdAt: true,
      },
    });

    return created;
  }

  /**
   * Record batch performance metrics at end of session.
   * Updates the session aggregate metrics.
   */
  async recordSessionSummary(
    sessionId: string,
    metrics: PerformanceMetricInput[],
  ) {
    const session = await this.prisma.tryOnSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Create individual metric records
    if (metrics.length > 0) {
      await this.prisma.tryOnPerformanceMetric.createMany({
        data: metrics.map((m) => ({
          sessionId: session.id,
          fps: Math.round(m.fps),
          detectionLatencyMs: Math.round(m.detectionLatencyMs),
          renderLatencyMs: Math.round(m.renderLatencyMs),
          gpuInfo: m.gpuInfo || null,
          deviceType: m.deviceType,
          browserInfo: m.browserInfo || null,
        })),
      });
    }

    // Calculate and store aggregate metrics on session
    const avgFps =
      metrics.length > 0
        ? Math.round(
            metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length,
          )
        : 0;
    const avgDetectionLatency =
      metrics.length > 0
        ? Math.round(
            metrics.reduce((sum, m) => sum + m.detectionLatencyMs, 0) /
              metrics.length,
          )
        : 0;
    const avgRenderLatency =
      metrics.length > 0
        ? Math.round(
            metrics.reduce((sum, m) => sum + m.renderLatencyMs, 0) /
              metrics.length,
          )
        : 0;

    const aggregateMetrics = {
      avgFps,
      avgDetectionLatency,
      avgRenderLatency,
      sampleCount: metrics.length,
      gpuInfo: metrics[0]?.gpuInfo || null,
      deviceType: metrics[0]?.deviceType || 'unknown',
      browserInfo: metrics[0]?.browserInfo || null,
    };

    await this.prisma.tryOnSession.update({
      where: { id: session.id },
      data: {
        performanceMetrics: aggregateMetrics as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(
      `Performance summary saved for session ${sessionId}: avgFps=${avgFps}, samples=${metrics.length}`,
    );

    return aggregateMetrics;
  }

  /**
   * Get device performance statistics across all sessions.
   */
  async getDeviceStats(
    brandId?: string,
    days = 30,
  ): Promise<DevicePerformanceSummary[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const whereClause: Prisma.TryOnPerformanceMetricWhereInput = {
      createdAt: { gte: since },
      ...(brandId && {
        session: {
          configuration: {
            project: { brandId },
          },
        },
      }),
    };

    const metrics = await this.prisma.tryOnPerformanceMetric.groupBy({
      by: ['deviceType'],
      where: whereClause,
      _avg: {
        fps: true,
        detectionLatencyMs: true,
        renderLatencyMs: true,
      },
      _count: {
        id: true,
      },
    });

    return metrics.map((m) => ({
      deviceType: m.deviceType,
      avgFps: Math.round(m._avg.fps || 0),
      avgDetectionLatency: Math.round(m._avg.detectionLatencyMs || 0),
      avgRenderLatency: Math.round(m._avg.renderLatencyMs || 0),
      sampleCount: m._count.id,
      recommendedQuality: this.getRecommendedQuality(m._avg.fps || 0),
    }));
  }

  /**
   * Check device compatibility based on historical performance data.
   */
  async checkDeviceCompatibility(deviceType: string, gpuInfo?: string) {
    const stats = await this.prisma.tryOnPerformanceMetric.aggregate({
      where: {
        deviceType,
        ...(gpuInfo && { gpuInfo: { contains: gpuInfo } }),
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      },
      _avg: { fps: true, detectionLatencyMs: true, renderLatencyMs: true },
      _count: { id: true },
    });

    const avgFps = stats._avg.fps || 0;
    const sampleCount = stats._count.id;

    return {
      deviceType,
      gpuInfo: gpuInfo || null,
      sampleCount,
      avgFps: Math.round(avgFps),
      supported: sampleCount === 0 || avgFps >= 15, // Assume supported if no data
      recommendedQuality: this.getRecommendedQuality(avgFps),
      recommendedMode:
        avgFps >= 24
          ? '3d_full'
          : avgFps >= 15
            ? '3d_low'
            : avgFps > 0
              ? '2d_fallback'
              : '3d_full', // default if no data
    };
  }

  private getRecommendedQuality(
    avgFps: number,
  ): 'high' | 'medium' | 'low' | '2d_fallback' {
    if (avgFps >= 30) return 'high';
    if (avgFps >= 24) return 'medium';
    if (avgFps >= 15) return 'low';
    return '2d_fallback';
  }
}
