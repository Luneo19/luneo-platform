import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { randomBytes } from 'crypto';

export interface CreateShareInput {
  sessionId: string;
  screenshotId?: string;
  productId?: string;
  platform: string;
}

const APP_URL = process.env.APP_URL || 'https://app.luneo.com';
const SHARE_TTL_DAYS = 30;

@Injectable()
export class SocialSharingService {
  private readonly logger = new Logger(SocialSharingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a shareable link for a try-on screenshot or session.
   */
  async createShareLink(input: CreateShareInput) {
    const session = await this.prisma.tryOnSession.findUnique({
      where: { sessionId: input.sessionId },
      select: {
        id: true,
        configuration: {
          select: {
            project: { select: { brandId: true } },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${input.sessionId} not found`);
    }

    const brandId = session.configuration.project.brandId;
    const shareToken = this.generateShareToken();
    const shareUrl = `${APP_URL}/try-on-share/${shareToken}`;

    // SECURITY: Verify screenshot belongs to the same session
    let ogImageUrl: string | null = null;
    if (input.screenshotId) {
      const screenshot = await this.prisma.tryOnScreenshot.findUnique({
        where: { id: input.screenshotId },
        select: { sessionId: true, imageUrl: true, thumbnailUrl: true },
      });
      if (!screenshot) {
        throw new NotFoundException(`Screenshot ${input.screenshotId} not found`);
      }
      if (screenshot.sessionId !== session.id) {
        throw new BadRequestException('Screenshot does not belong to this session');
      }
      ogImageUrl = screenshot.imageUrl || screenshot.thumbnailUrl || null;
    }

    const share = await this.prisma.tryOnShare.create({
      data: {
        sessionId: session.id,
        screenshotId: input.screenshotId || null,
        productId: input.productId || null,
        brandId,
        platform: input.platform,
        shareToken,
        shareUrl,
        ogImageUrl,
        expiresAt: new Date(Date.now() + SHARE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
      select: {
        id: true,
        shareToken: true,
        shareUrl: true,
        ogImageUrl: true,
        platform: true,
        expiresAt: true,
      },
    });

    this.logger.log(`Share link created: ${share.shareUrl} (${input.platform})`);
    return share;
  }

  /**
   * Get the share page data for a given share token.
   * Used to render the public /try-on-share/[shareToken] page with OG tags.
   */
  async getSharePage(shareToken: string) {
    const share = await this.prisma.tryOnShare.findUnique({
      where: { shareToken },
      select: {
        id: true,
        shareToken: true,
        shareUrl: true,
        ogImageUrl: true,
        platform: true,
        viewCount: true,
        expiresAt: true,
        productId: true,
        session: {
          select: {
            sessionId: true,
            configuration: {
              select: {
                name: true,
                productType: true,
                project: {
                  select: {
                    brand: {
                      select: {
                        name: true,
                        slug: true,
                        logo: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        screenshot: {
          select: {
            imageUrl: true,
            thumbnailUrl: true,
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!share) {
      throw new NotFoundException('Share not found or expired');
    }

    // Check expiry
    if (share.expiresAt < new Date()) {
      throw new NotFoundException('This share link has expired');
    }

    // Increment view count (fire-and-forget)
    this.prisma.tryOnShare
      .update({
        where: { id: share.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    const brand = share.session.configuration.project.brand;
    const product = share.screenshot?.product || null;

    return {
      shareToken: share.shareToken,
      image: share.ogImageUrl || share.screenshot?.imageUrl || null,
      thumbnail: share.screenshot?.thumbnailUrl || null,
      product: product
        ? {
            id: product.id,
            name: product.name,
            image: Array.isArray(product.images)
              ? (product.images as string[])[0]
              : null,
          }
        : null,
      brand: {
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
      },
      productType: share.session.configuration.productType,
      tryOnUrl: product
        ? `${APP_URL}/widget/${brand.slug}/${product.id}`
        : null,
      viewCount: share.viewCount,
    };
  }

  /**
   * Track a click from a share page (click to product or try-on).
   * Only tracks if the share link is not expired.
   */
  async trackShareClick(shareToken: string) {
    const share = await this.prisma.tryOnShare.findUnique({
      where: { shareToken },
      select: { id: true, expiresAt: true },
    });

    if (!share) return;

    // Don't track clicks on expired shares
    if (share.expiresAt && share.expiresAt < new Date()) {
      return;
    }

    await this.prisma.tryOnShare.update({
      where: { id: share.id },
      data: { clickCount: { increment: 1 } },
    });
  }

  /**
   * Get share analytics for a brand.
   */
  async getShareAnalytics(brandId: string, days = 30) {
    const safeDays = Math.min(Math.max(1, days), 365);
    const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

    const [shares, platformBreakdown, totals] = await Promise.all([
      this.prisma.tryOnShare.count({
        where: { brandId, createdAt: { gte: since } },
      }),
      this.prisma.tryOnShare.groupBy({
        by: ['platform'],
        where: { brandId, createdAt: { gte: since } },
        _count: { id: true },
        _sum: { viewCount: true, clickCount: true },
      }),
      this.prisma.tryOnShare.aggregate({
        where: { brandId, createdAt: { gte: since } },
        _sum: { viewCount: true, clickCount: true },
      }),
    ]);

    return {
      period: { days: safeDays },
      totalShares: shares,
      totalViews: totals._sum.viewCount ?? 0,
      totalClicks: totals._sum.clickCount ?? 0,
      clickRate:
        (totals._sum.viewCount ?? 0) > 0
          ? Math.round(
              ((totals._sum.clickCount ?? 0) / (totals._sum.viewCount ?? 1)) *
                10000,
            ) / 100
          : 0,
      byPlatform: platformBreakdown.map((p) => ({
        platform: p.platform,
        shares: p._count.id,
        views: p._sum.viewCount ?? 0,
        clicks: p._sum.clickCount ?? 0,
      })),
    };
  }

  private generateShareToken(): string {
    return randomBytes(12).toString('base64url');
  }
}
