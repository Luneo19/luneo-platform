import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';

/** Raw landmark position from tracking (x, y, z optional). */
export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

/** Frame data: array of landmarks (e.g. face/hand keypoints). */
export interface TrackingFrameData {
  landmarks: LandmarkPoint[];
  timestamp?: number;
}

/** Smoothed positions after Kalman filter. */
export interface SmoothedFrameData {
  landmarks: LandmarkPoint[];
  timestamp?: number;
}

/** Per-landmark 1D Kalman state (x, y, z). */
interface KalmanState {
  estimate: number;
  errorCovariance: number;
}

/** Session-level Kalman state: one state per coordinate per landmark index. */
interface SessionKalmanState {
  byLandmark: Map<number, { x: KalmanState; y: KalmanState; z?: KalmanState }>;
}

/** Overlay options: shadow, reflection, LOD. */
export interface RealisticOverlayResult {
  shadow: { enabled: boolean; blur: number; opacity: number; offsetY: number };
  reflection: { enabled: boolean; strength: number; fresnel: number };
  lod: { level: 'high' | 'medium' | 'low'; distance: number; pixelRatio: number };
}

/** Date range for analytics. */
export interface TryOnDateRange {
  from: Date;
  to: Date;
}

/** Analytics result. */
export interface TryOnAnalyticsResult {
  totalSessions: number;
  uniqueUsers: number;
  avgSessionDurationSeconds: number;
  heatmap: { productId: string; viewCount: number; totalTimeSeconds: number }[];
  funnel: {
    sessionStarted: number;
    screenshotTaken: number;
    addedToCart: number;
    purchased: number;
  };
  deviceBreakdown: { mobile: number; desktop: number; other: number };
}

/** Screenshot input for captureAndProcess. */
export interface ScreenshotInput {
  imageData: Buffer;
  productId: string;
  addWatermark?: boolean;
  watermarkText?: string;
}

/** Result of captureAndProcess. */
export interface CaptureProcessResult {
  imageUrl: string;
  thumbnailUrl: string;
  formats: { format: string; url: string; width?: number; height?: number }[];
}

// Kalman tuning
const PROCESS_NOISE = 0.01;
const MEASUREMENT_NOISE = 0.1;
const INITIAL_ERROR = 1;

@Injectable()
export class TryOnEnhancedService {
  private readonly kalmanStateBySession = new Map<string, SessionKalmanState>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Applies Kalman filter smoothing to tracking landmarks. State is stored per session.
   */
  stabilizeTracking(sessionId: string, frameData: TrackingFrameData): SmoothedFrameData {
    let state = this.kalmanStateBySession.get(sessionId);
    if (!state) {
      state = { byLandmark: new Map() };
      this.kalmanStateBySession.set(sessionId, state);
    }

    const smoothed: LandmarkPoint[] = frameData.landmarks.map((lm, idx) => {
      let landmarkState = state!.byLandmark.get(idx);
      if (!landmarkState) {
        landmarkState = {
          x: this.initKalman(lm.x),
          y: this.initKalman(lm.y),
          z: lm.z !== undefined ? this.initKalman(lm.z) : undefined,
        };
        state!.byLandmark.set(idx, landmarkState);
      }

      const x = this.kalmanStep(landmarkState.x, lm.x);
      const y = this.kalmanStep(landmarkState.y, lm.y);
      const z =
        lm.z !== undefined && landmarkState.z
          ? this.kalmanStep(landmarkState.z, lm.z)
          : lm.z;

      return { x, y, ...(z !== undefined && { z }) } as LandmarkPoint;
    });

    return { landmarks: smoothed, timestamp: frameData.timestamp };
  }

  private initKalman(initial: number): KalmanState {
    return { estimate: initial, errorCovariance: INITIAL_ERROR };
  }

  private kalmanStep(state: KalmanState, measurement: number): number {
    const predError = state.errorCovariance + PROCESS_NOISE;
    const gain = predError / (predError + MEASUREMENT_NOISE);
    const estimate = state.estimate + gain * (measurement - state.estimate);
    const errorCovariance = (1 - gain) * predError;
    state.estimate = estimate;
    state.errorCovariance = errorCovariance;
    return estimate;
  }

  /**
   * Generates realistic AR overlay config: shadow, reflection map, LOD by distance.
   */
  generateRealisticOverlay(
    _sessionId: string,
    _productId: string,
    trackingData: { distance?: number; material?: string; productType?: string },
  ): RealisticOverlayResult {
    const distance = trackingData.distance ?? 1;
    const material = (trackingData.material ?? 'plastic').toLowerCase();
    const productType = (trackingData.productType ?? 'accessory').toLowerCase();

    const lodLevel =
      distance > 2 ? 'low' : distance > 1 ? 'medium' : 'high';
    const pixelRatio = lodLevel === 'high' ? 1 : lodLevel === 'medium' ? 0.75 : 0.5;

    const shadow = {
      enabled: !['background', 'digital'].includes(productType),
      blur: productType === 'eyewear' ? 12 : 8,
      opacity: 0.25,
      offsetY: 4,
    };

    const reflectionStrength =
      material === 'metal' ? 0.6 : material === 'glass' ? 0.5 : 0.15;
    const reflection = {
      enabled: reflectionStrength > 0.1,
      strength: reflectionStrength,
      fresnel: material === 'glass' ? 0.4 : 0.2,
    };

    return {
      shadow,
      reflection,
      lod: { level: lodLevel, distance, pixelRatio },
    };
  }

  /**
   * Returns try-on analytics for a brand and date range.
   */
  async getAnalytics(brandId: string, dateRange: TryOnDateRange): Promise<TryOnAnalyticsResult> {
    const { from, to } = dateRange;

    const [
      sessionsAgg,
      uniqueVisitors,
      sessionsWithDuration,
      screenshotsByProduct,
      conversionsByAction,
      deviceCounts,
    ] = await Promise.all([
      this.prisma.tryOnSession.count({
        where: {
          configuration: { project: { brandId } },
          startedAt: { gte: from, lte: to },
        },
      }),
      this.prisma.tryOnSession.findMany({
        where: {
          configuration: { project: { brandId } },
          startedAt: { gte: from, lte: to },
        },
        select: { visitorId: true },
        distinct: ['visitorId'],
      }),
      this.prisma.tryOnSession.findMany({
        where: {
          configuration: { project: { brandId } },
          startedAt: { gte: from, lte: to },
          endedAt: { not: null },
        },
        select: {
          startedAt: true,
          endedAt: true,
        },
      }),
      this.prisma.tryOnScreenshot.groupBy({
        by: ['productId'],
        where: {
          session: {
            configuration: { project: { brandId } },
            startedAt: { gte: from, lte: to },
          },
        },
        _count: { id: true },
      }),
      this.prisma.tryOnConversion.groupBy({
        by: ['action'],
        where: { brandId, createdAt: { gte: from, lte: to } },
        _count: { id: true },
      }),
      this.prisma.tryOnSession.findMany({
        where: {
          configuration: { project: { brandId } },
          startedAt: { gte: from, lte: to },
          deviceInfo: { not: null },
        },
        select: { deviceInfo: true },
      }),
    ]);

    const durations = sessionsWithDuration
      .filter((s) => s.endedAt)
      .map((s) => (s.endedAt!.getTime() - s.startedAt.getTime()) / 1000);
    const avgSessionDurationSeconds =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    const funnel = {
      sessionStarted: sessionsAgg,
      screenshotTaken: 0,
      addedToCart: 0,
      purchased: 0,
    };
    for (const g of conversionsByAction) {
      if (g.action === 'ADD_TO_CART') funnel.addedToCart = g._count.id;
      else if (g.action === 'PURCHASE') funnel.purchased = g._count.id;
    }
    const sessionsWithScreenshots = await this.prisma.tryOnSession.count({
      where: {
        configuration: { project: { brandId } },
        startedAt: { gte: from, lte: to },
        screenshotsTaken: { gt: 0 },
      },
    });
    funnel.screenshotTaken = sessionsWithScreenshots;

    let mobile = 0,
      desktop = 0,
      other = 0;
    for (const s of deviceCounts) {
      const info = (s.deviceInfo ?? '') as string;
      if (/mobile|android|iphone|ipad/i.test(info)) mobile++;
      else if (/desktop|windows|mac|linux/i.test(info)) desktop++;
      else other++;
    }

    const heatmap = screenshotsByProduct.map((g) => ({
      productId: g.productId,
      viewCount: g._count.id,
      totalTimeSeconds: 0,
    }));

    return {
      totalSessions: sessionsAgg,
      uniqueUsers: uniqueVisitors.length,
      avgSessionDurationSeconds: Math.round(avgSessionDurationSeconds * 10) / 10,
      heatmap: heatmap.sort((a, b) => b.viewCount - a.viewCount),
      funnel,
      deviceBreakdown: { mobile, desktop, other },
    };
  }

  /**
   * Enhanced screenshot capture: quality optimization, optional watermark, thumbnail, social formats.
   * Uploads to storage and optionally creates TryOnScreenshot record.
   */
  async captureAndProcess(
    sessionId: string,
    screenshotData: ScreenshotInput,
  ): Promise<CaptureProcessResult> {
    const session = await this.prisma.tryOnSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const sharp = await import('sharp');
    let buffer = screenshotData.imageData;

    buffer = await sharp
      .default(buffer)
      .png({ quality: 90, compressionLevel: 6 })
      .toBuffer();

    if (screenshotData.addWatermark && screenshotData.watermarkText) {
      const meta = await sharp.default(buffer).metadata();
      const w = meta.width ?? 800;
      const h = meta.height ?? 800;
      const svg = Buffer.from(
        `<svg width="${w}" height="${h}"><text x="${w - 20}" y="${h - 20}" font-size="14" fill="rgba(255,255,255,0.5)" text-anchor="end">${escapeXml(screenshotData.watermarkText)}</text></svg>`,
      );
      buffer = await sharp
        .default(buffer)
        .composite([{ input: svg, top: 0, left: 0 }])
        .png()
        .toBuffer();
    }

    const thumbBuffer = await sharp
      .default(buffer)
      .resize(200, 200, { fit: 'cover' })
      .toBuffer();

    const instagramBuffer = await sharp
      .default(buffer)
      .resize(1080, 1080, { fit: 'inside' })
      .toBuffer();

    const prefix = `try-on/screenshots/${sessionId}/${Date.now()}`;
    const [imageUrl, thumbnailUrl, instagramUrl] = await Promise.all([
      this.storageService.uploadFile(`${prefix}.png`, buffer, 'image/png'),
      this.storageService.uploadFile(`${prefix}_thumb.png`, thumbBuffer, 'image/png'),
      this.storageService.uploadFile(`${prefix}_1080.png`, instagramBuffer, 'image/png'),
    ]);

    await this.prisma.tryOnScreenshot.create({
      data: {
        sessionId: session.id,
        productId: screenshotData.productId,
        imageUrl,
        thumbnailUrl,
        metadata: { formats: ['original', 'thumbnail', 'instagram'] },
      },
    });

    return {
      imageUrl,
      thumbnailUrl,
      formats: [
        { format: 'original', url: imageUrl },
        { format: 'thumbnail', url: thumbnailUrl, width: 200, height: 200 },
        { format: 'instagram', url: instagramUrl, width: 1080, height: 1080 },
      ],
    };
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
