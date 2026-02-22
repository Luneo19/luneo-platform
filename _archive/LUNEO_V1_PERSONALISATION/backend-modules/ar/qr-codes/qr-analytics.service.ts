/**
 * QR Analytics Service - Track QR scans and provide aggregated analytics.
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface RecordScanContext {
  platform: string;
  browser: string;
  device: string;
  country?: string;
  city?: string;
  sessionId?: string;
  userId?: string;
  landedOnAR?: boolean;
  arDuration?: number;
  conversion?: string;
}

export interface ScanAnalytics {
  totalScans: number;
  uniqueScanners: number;
  lastScannedAt: Date | null;
  byPlatform: { platform: string; count: number }[];
  byDevice: { device: string; count: number }[];
  arLaunches: number;
  conversions: { action: string; count: number }[];
}

@Injectable()
export class QrAnalyticsService {
  private readonly logger = new Logger(QrAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async assertQrAccess(qrCodeId: string, brandId: string): Promise<void> {
    const qr = await this.prisma.aRQRCode.findFirst({
      where: { id: qrCodeId, project: { brandId } },
    });
    if (!qr) {
      throw new ForbiddenException('QR code not found or access denied');
    }
  }

  /**
   * Record a QR scan (creates ARQRScan record).
   */
  async recordScan(qrCodeId: string, context: RecordScanContext): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.aRQRScan.create({
        data: {
          qrCodeId,
          platform: context.platform,
          browser: context.browser,
          device: context.device,
          country: context.country ?? '',
          city: context.city ?? '',
          sessionId: context.sessionId ?? undefined,
          userId: context.userId ?? undefined,
          landedOnAR: context.landedOnAR ?? false,
          arDuration: context.arDuration ?? undefined,
          conversion: context.conversion ?? undefined,
        },
      }),
      this.prisma.aRQRCode.update({
        where: { id: qrCodeId },
        data: {
          scanCount: { increment: 1 },
          lastScannedAt: new Date(),
        },
      }),
    ]);
    this.logger.debug(`Recorded scan for QR ${qrCodeId}`);
  }

  /**
   * Get aggregated analytics for a QR code.
   */
  async getScanAnalytics(qrCodeId: string, brandId: string): Promise<ScanAnalytics> {
    await this.assertQrAccess(qrCodeId, brandId);

    const qr = await this.prisma.aRQRCode.findUnique({
      where: { id: qrCodeId },
      select: { scanCount: true, uniqueScanners: true, lastScannedAt: true },
    });
    if (!qr) {
      throw new NotFoundException('QR code not found');
    }

    const scans = await this.prisma.aRQRScan.findMany({
      where: { qrCodeId },
      select: { platform: true, device: true, landedOnAR: true, conversion: true },
    });

    const scansGeneric = scans as Record<string, unknown>[];
    const byPlatform = this.aggregateBy(scansGeneric, 'platform').map(({ key, count }) => ({ platform: key, count }));
    const byDevice = this.aggregateBy(scansGeneric, 'device').map(({ key, count }) => ({ device: key, count }));
    const arLaunches = scans.filter((s) => s.landedOnAR).length;
    const byConversion = this.aggregateBy(
      scans.filter((s) => s.conversion != null) as Record<string, unknown>[],
      'conversion',
    );

    return {
      totalScans: qr.scanCount,
      uniqueScanners: qr.uniqueScanners,
      lastScannedAt: qr.lastScannedAt,
      byPlatform,
      byDevice,
      arLaunches,
      conversions: byConversion.map((c) => ({ action: c.key, count: c.count })),
    };
  }

  /**
   * Get top QR codes by scan count for a project.
   */
  async getTopQRCodes(projectId: string, brandId: string, limit = 10) {
    const project = await this.prisma.aRProject.findFirst({
      where: { id: projectId, brandId },
    });
    if (!project) {
      throw new ForbiddenException('Project not found or access denied');
    }

    return this.prisma.aRQRCode.findMany({
      where: { projectId, isActive: true },
      orderBy: { scanCount: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        shortCode: true,
        scanCount: true,
        uniqueScanners: true,
        lastScannedAt: true,
      },
    });
  }

  private aggregateBy(items: Record<string, unknown>[], key: string): { key: string; count: number }[] {
    const map = new Map<string, number>();
    for (const item of items) {
      const v = item[key];
      if (typeof v === 'string' && v !== '') map.set(v, (map.get(v) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([k, count]) => ({ key: k, count }));
  }
}
