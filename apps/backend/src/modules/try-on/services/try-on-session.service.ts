import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';
import { randomBytes } from 'crypto';

@Injectable()
export class TryOnSessionService {
  private readonly logger = new Logger(TryOnSessionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Génère un ID de session unique
   */
  private generateSessionId(): string {
    return `ses_${randomBytes(16).toString('hex')}`;
  }

  /**
   * Démarre une nouvelle session try-on
   */
  @CacheInvalidate({
    tags: (args) => [`try-on-config:${args[0]}`, 'try-on-sessions:list'],
  })
  async startSession(
    configurationId: string,
    visitorId: string,
    deviceInfo?: Record<string, unknown>,
  ) {
    // Vérifier que la configuration existe
    const config = await this.prisma.tryOnConfiguration.findUnique({
      where: { id: configurationId },
      select: { id: true, isActive: true },
    });

    if (!config) {
      throw new NotFoundException(
        `Try-on configuration with ID ${configurationId} not found`,
      );
    }

    if (!config.isActive) {
      throw new BadRequestException('Try-on configuration is not active');
    }

    const sessionId = this.generateSessionId();

    const session = await this.prisma.tryOnSession.create({
      data: {
        configurationId,
        sessionId,
        visitorId,
        deviceInfo: typeof deviceInfo === 'object' && deviceInfo !== null ? JSON.stringify(deviceInfo) : (String(deviceInfo ?? '{}')),
        productsTried: [],
      },
      select: {
        id: true,
        sessionId: true,
        visitorId: true,
        startedAt: true,
        configuration: {
          select: {
            id: true,
            name: true,
            productType: true,
            settings: true,
            uiConfig: true,
          },
        },
      },
    });

    this.logger.log(`Try-on session started: ${sessionId}`);

    return session;
  }

  /**
   * Met à jour une session (produits essayés, screenshots, etc.)
   */
  @CacheInvalidate({
    tags: (args) => [`try-on-session:${args[0]}`, 'try-on-sessions:list'],
  })
  async updateSession(
    sessionId: string,
    updates: {
      productsTried?: string[];
      screenshotsTaken?: number;
      shared?: boolean;
      converted?: boolean;
    },
  ) {
    const session = await this.prisma.tryOnSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const updated = await this.prisma.tryOnSession.update({
      where: { id: session.id },
      data: updates,
      select: {
        id: true,
        sessionId: true,
        productsTried: true,
        screenshotsTaken: true,
        shared: true,
        converted: true,
        startedAt: true,
        endedAt: true,
      },
    });

    return updated;
  }

  /**
   * Termine une session
   */
  @CacheInvalidate({
    tags: (args) => [`try-on-session:${args[0]}`, 'try-on-sessions:list'],
  })
  async endSession(sessionId: string) {
    const session = await this.prisma.tryOnSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const ended = await this.prisma.tryOnSession.update({
      where: { id: session.id },
      data: { endedAt: new Date() },
      select: {
        id: true,
        sessionId: true,
        startedAt: true,
        endedAt: true,
        productsTried: true,
        screenshotsTaken: true,
        shared: true,
        converted: true,
      },
    });

    this.logger.log(`Try-on session ended: ${sessionId}`);

    return ended;
  }

  /**
   * Récupère une session par son ID
   */
  @Cacheable({
    type: 'try-on-session',
    ttl: 300,
    keyGenerator: (args) => `try-on-session:${args[0]}`,
    tags: () => ['try-on-sessions:list'],
  })
  async findOne(sessionId: string) {
    const session = await this.prisma.tryOnSession.findUnique({
      where: { sessionId },
      select: {
        id: true,
        sessionId: true,
        visitorId: true,
        deviceInfo: true,
        startedAt: true,
        endedAt: true,
        productsTried: true,
        screenshotsTaken: true,
        shared: true,
        converted: true,
        configuration: {
          select: {
            id: true,
            name: true,
            productType: true,
          },
        },
        screenshots: {
          select: {
            id: true,
            imageUrl: true,
            thumbnailUrl: true,
            sharedUrl: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    return session;
  }

  /**
   * Liste les sessions d'une configuration
   */
  @Cacheable({
    type: 'try-on-session',
    ttl: 600,
    keyGenerator: (args) =>
      `try-on-sessions:findAll:${args[0]}:${JSON.stringify(args[1])}`,
    tags: (args) => [`try-on-config:${args[0]}`, 'try-on-sessions:list'],
  })
  async findAll(
    configurationId: string,
    limit: number = 50,
  ) {
    return this.prisma.tryOnSession.findMany({
      where: { configurationId },
      select: {
        id: true,
        sessionId: true,
        visitorId: true,
        startedAt: true,
        endedAt: true,
        productsTried: true,
        screenshotsTaken: true,
        shared: true,
        converted: true,
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Returns try-on analytics for a brand over the last N days.
   */
  async getAnalytics(
    brandId: string | null | undefined,
    days: number = 30,
  ): Promise<{
    totalSessions: number;
    totalProductsTried: number;
    totalScreenshots: number;
    avgSessionDuration: number;
    sessionsOverTime: Array<{ date: string; count: number }>;
    topProducts: Array<{ productId: string; productName: string; tryCount: number }>;
    conversionRate: number;
    categoryBreakdown: Array<{ category: string; count: number }>;
  }> {
    const empty = {
      totalSessions: 0,
      totalProductsTried: 0,
      totalScreenshots: 0,
      avgSessionDuration: 0,
      sessionsOverTime: [] as Array<{ date: string; count: number }>,
      topProducts: [] as Array<{ productId: string; productName: string; tryCount: number }>,
      conversionRate: 0,
      categoryBreakdown: [] as Array<{ category: string; count: number }>,
    };

    if (!brandId) {
      return empty;
    }

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const where = {
      configuration: { project: { brandId } },
      startedAt: { gte: since },
    };

    const [totalSessions, screenshotSum, sessionsForAggregates] = await Promise.all([
      this.prisma.tryOnSession.count({ where }),
      this.prisma.tryOnSession.aggregate({
        where,
        _sum: { screenshotsTaken: true },
      }),
      this.prisma.tryOnSession.findMany({
        where,
        select: {
          startedAt: true,
          endedAt: true,
          productsTried: true,
          converted: true,
          configuration: { select: { productType: true } },
        },
      }),
    ]);

    const totalScreenshots = screenshotSum._sum.screenshotsTaken ?? 0;
    const totalProductsTried = sessionsForAggregates.reduce(
      (acc, s) => acc + (s.productsTried?.length ?? 0),
      0,
    );

    const withEnded = sessionsForAggregates.filter((s) => s.endedAt != null);
    const totalDurationSeconds = withEnded.reduce((acc, s) => {
      if (!s.endedAt) return acc;
      return acc + (s.endedAt.getTime() - s.startedAt.getTime()) / 1000;
    }, 0);
    const avgSessionDuration =
      withEnded.length > 0 ? Math.round(totalDurationSeconds / withEnded.length) : 0;

    const dateCounts = new Map<string, number>();
    for (const s of sessionsForAggregates) {
      const key = s.startedAt.toISOString().slice(0, 10);
      dateCounts.set(key, (dateCounts.get(key) ?? 0) + 1);
    }
    const sessionsOverTime = Array.from(dateCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const categoryCounts = new Map<string, number>();
    for (const s of sessionsForAggregates) {
      const cat = s.configuration?.productType ?? 'UNKNOWN';
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }
    const categoryBreakdown = Array.from(categoryCounts.entries()).map(([category, count]) => ({
      category,
      count,
    }));

    const productIdCounts = new Map<string, number>();
    for (const s of sessionsForAggregates) {
      for (const id of s.productsTried ?? []) {
        if (id) productIdCounts.set(id, (productIdCounts.get(id) ?? 0) + 1);
      }
    }
    const topProductIds = Array.from(productIdCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([productId]) => productId);

    const productNames =
      topProductIds.length > 0
        ? await this.prisma.product.findMany({
            where: { id: { in: topProductIds } },
            select: { id: true, name: true },
          })
        : [];
    const nameById = new Map(productNames.map((p) => [p.id, p.name ?? p.id]));

    const topProducts = Array.from(productIdCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([productId, tryCount]) => ({
        productId,
        productName: nameById.get(productId) ?? productId,
        tryCount,
      }));

    const convertedCount = sessionsForAggregates.filter((s) => s.converted).length;
    const conversionRate =
      totalSessions > 0 ? Math.round((convertedCount / totalSessions) * 100 * 100) / 100 : 0;

    return {
      totalSessions,
      totalProductsTried,
      totalScreenshots,
      avgSessionDuration,
      sessionsOverTime,
      topProducts,
      conversionRate,
      categoryBreakdown,
    };
  }
}
