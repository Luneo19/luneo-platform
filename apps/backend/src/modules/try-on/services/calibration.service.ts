import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CalibrationData {
  deviceFingerprint: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  cameraResolution: string; // e.g. "1280x720"
  averageDistance: number; // Average camera-to-subject distance in cm
  pixelToRealRatio: number; // How many pixels per real-world mm
  accuracyScore: number; // 0 to 1
  handSizeNormalized?: number; // Normalized hand size from MediaPipe
  faceWidthNormalized?: number; // Normalized face width from MediaPipe
}

export interface CalibrationRecommendation {
  scaleFactor: number;
  positionOffset: { x: number; y: number; z: number };
  qualityLevel: 'high' | 'medium' | 'low';
  useAR: boolean;
}

@Injectable()
export class CalibrationService {
  private readonly logger = new Logger(CalibrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Store calibration data for a session.
   * Also updates aggregate calibration data by device fingerprint.
   */
  async saveCalibration(sessionId: string, data: CalibrationData) {
    // Update the session with calibration data
    const session = await this.prisma.tryOnSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!session) {
      this.logger.warn(`Session not found for calibration: ${sessionId}`);
      return null;
    }

    const updated = await this.prisma.tryOnSession.update({
      where: { id: session.id },
      data: {
        calibrationData: data as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        sessionId: true,
        calibrationData: true,
      },
    });

    this.logger.log(
      `Calibration saved for session ${sessionId}: accuracy=${data.accuracyScore}`,
    );

    return updated;
  }

  /**
   * Get calibration recommendation for a device.
   * Uses historical data from previous sessions on similar devices.
   */
  async getRecommendation(
    deviceType: string,
    cameraResolution?: string,
  ): Promise<CalibrationRecommendation> {
    // Query recent sessions with calibration data from similar devices
    const recentSessions = await this.prisma.tryOnSession.findMany({
      where: {
        calibrationData: { not: Prisma.DbNull },
        deviceInfo: { contains: deviceType },
        startedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      select: {
        calibrationData: true,
        performanceMetrics: true,
      },
      take: 100,
      orderBy: { startedAt: 'desc' },
    });

    if (recentSessions.length === 0) {
      // Return defaults if no historical data
      return this.getDefaultRecommendation(deviceType);
    }

    // Aggregate calibration data
    let totalScale = 0;
    let count = 0;

    for (const session of recentSessions) {
      const cal = session.calibrationData as Record<string, unknown> | null;
      if (cal && typeof cal.pixelToRealRatio === 'number') {
        totalScale += cal.pixelToRealRatio as number;
        count++;
      }
    }

    const avgPixelRatio = count > 0 ? totalScale / count : 1;

    // Determine quality from performance history
    let totalFps = 0;
    let perfCount = 0;
    for (const session of recentSessions) {
      const perf = session.performanceMetrics as Record<string, unknown> | null;
      if (perf && typeof perf.avgFps === 'number') {
        totalFps += perf.avgFps as number;
        perfCount++;
      }
    }
    const avgFps = perfCount > 0 ? totalFps / perfCount : 30;

    const qualityLevel: 'high' | 'medium' | 'low' =
      avgFps >= 30 ? 'high' : avgFps >= 20 ? 'medium' : 'low';

    return {
      scaleFactor: avgPixelRatio > 0 ? 1 / avgPixelRatio : 1,
      positionOffset: { x: 0, y: 0, z: 0 },
      qualityLevel,
      useAR: deviceType === 'mobile' && avgFps >= 24,
    };
  }

  private getDefaultRecommendation(
    deviceType: string,
  ): CalibrationRecommendation {
    const isMobile = deviceType === 'mobile' || deviceType === 'tablet';
    return {
      scaleFactor: 1.0,
      positionOffset: { x: 0, y: 0, z: 0 },
      qualityLevel: isMobile ? 'medium' : 'high',
      useAR: isMobile,
    };
  }
}
