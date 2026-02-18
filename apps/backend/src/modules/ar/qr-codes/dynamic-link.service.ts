/**
 * Dynamic Link Service - Short links for AR: create, resolve, increment scan count.
 */

import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { QRCodeType } from '@prisma/client';
import { randomBytes } from 'crypto';

export interface CreateShortLinkInput {
  projectId: string;
  brandId: string;
  targetUrl: string;
  type: QRCodeType;
  name: string;
  description?: string;
}

export interface ResolveShortLinkResult {
  targetUrl: string;
  projectId: string;
  qrCodeId: string;
  platformRouting?: string;
}

@Injectable()
export class DynamicLinkService {
  private readonly logger = new Logger(DynamicLinkService.name);

  constructor(private readonly prisma: PrismaService) {}

  private generateShortCode(): string {
    return randomBytes(4).toString('base64url').replace(/[-_]/g, 'x').slice(0, 8);
  }

  /**
   * Create a short link (ARQRCode with unique shortCode).
   */
  async createShortLink(input: CreateShortLinkInput): Promise<{ shortCode: string; qrCodeId: string }> {
    const project = await this.prisma.aRProject.findFirst({
      where: { id: input.projectId, brandId: input.brandId },
    });
    if (!project) {
      throw new ForbiddenException('Project not found or access denied');
    }

    let shortCode = this.generateShortCode();
    let exists = await this.prisma.aRQRCode.findUnique({ where: { shortCode } });
    let attempts = 0;
    while (exists && attempts < 10) {
      shortCode = this.generateShortCode();
      exists = await this.prisma.aRQRCode.findUnique({ where: { shortCode } });
      attempts++;
    }
    if (exists) {
      shortCode = `${shortCode}-${Date.now().toString(36)}`;
    }

    const qr = await this.prisma.aRQRCode.create({
      data: {
        projectId: input.projectId,
        type: input.type,
        targetURL: input.targetUrl,
        shortCode,
        name: input.name,
        description: input.description ?? undefined,
        tags: [],
      },
    });

    this.logger.log(`Created short link ${shortCode} -> ${input.targetUrl}`);
    return { shortCode, qrCodeId: qr.id };
  }

  /**
   * Resolve short code to target URL and optional platform routing info.
   */
  async resolveShortLink(shortCode: string): Promise<ResolveShortLinkResult | null> {
    const qr = await this.prisma.aRQRCode.findUnique({
      where: { shortCode, isActive: true },
      select: { id: true, targetURL: true, projectId: true },
    });
    if (!qr) return null;
    return {
      targetUrl: qr.targetURL,
      projectId: qr.projectId,
      qrCodeId: qr.id,
      platformRouting: undefined,
    };
  }

  /**
   * Increment scan count for a short code (by shortCode string).
   */
  async incrementScanCount(shortCode: string): Promise<void> {
    await this.prisma.aRQRCode.updateMany({
      where: { shortCode },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date(),
      },
    });
  }
}
