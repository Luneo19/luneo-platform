/**
 * Session Tracker Service - Track AR sessions: start, end, get details.
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface StartSessionData {
  projectId: string;
  modelId?: string;
  userId?: string;
  platform: string;
  device: string;
  browser: string;
  arMethod: string;
  featuresUsed?: string[];
  country?: string;
  region?: string;
}

export interface EndSessionData {
  duration?: number;
  placementCount?: number;
  rotationCount?: number;
  scaleChangeCount?: number;
  screenshotsTaken?: number;
  shareCount?: number;
  trackingQuality?: number;
  conversionAction?: string;
  conversionValue?: number;
  errors?: string[];
}

@Injectable()
export class SessionTrackerService {
  private readonly logger = new Logger(SessionTrackerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start an AR session (create ARSession record).
   */
  async startSession(data: StartSessionData): Promise<{ sessionId: string }> {
    const session = await this.prisma.aRSession.create({
      data: {
        projectId: data.projectId,
        modelId: data.modelId ?? undefined,
        userId: data.userId ?? undefined,
        platform: data.platform,
        device: data.device,
        browser: data.browser,
        arMethod: data.arMethod,
        featuresUsed: data.featuresUsed ?? [],
        country: data.country ?? undefined,
        region: data.region ?? undefined,
      },
    });
    this.logger.log(`AR session started: ${session.id} project=${data.projectId}`);
    return { sessionId: session.id };
  }

  /**
   * End session: update with duration and counters.
   */
  async endSession(sessionId: string, data: EndSessionData): Promise<{ ok: boolean }> {
    const session = await this.prisma.aRSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.aRSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        ...(data.duration != null && { duration: data.duration }),
        ...(data.placementCount != null && { placementCount: data.placementCount }),
        ...(data.rotationCount != null && { rotationCount: data.rotationCount }),
        ...(data.scaleChangeCount != null && { scaleChangeCount: data.scaleChangeCount }),
        ...(data.screenshotsTaken != null && { screenshotsTaken: data.screenshotsTaken }),
        ...(data.shareCount != null && { shareCount: data.shareCount }),
        ...(data.trackingQuality != null && { trackingQuality: data.trackingQuality }),
        ...(data.conversionAction != null && { conversionAction: data.conversionAction }),
        ...(data.conversionValue != null && { conversionValue: data.conversionValue }),
        ...(data.errors != null && { errors: data.errors }),
      },
    });
    this.logger.log(`AR session ended: ${sessionId}`);
    return { ok: true };
  }

  /**
   * Get session details by ID (with project access check when brandId provided).
   */
  async getSessionDetails(sessionId: string, brandId?: string) {
    const session = await this.prisma.aRSession.findUnique({
      where: { id: sessionId },
      include: {
        project: { select: { id: true, name: true, brandId: true } },
        model: { select: { id: true, name: true, thumbnailURL: true } },
      },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (brandId && session.project.brandId !== brandId) {
      throw new ForbiddenException('Access denied');
    }
    return session;
  }
}
