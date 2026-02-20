import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  Configurator3DSessionStatus,
  ConversionType,
  InteractionType,
} from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Configurator3DPricingService } from './configurator-3d-pricing.service';
import { randomBytes } from 'crypto';
import {
  normalizePagination,
  createPaginationResult,
  PaginationParams,
  PaginationResult,
} from '@/libs/prisma/pagination.helper';

export interface StartSessionDto {
  configurationId: string;
  visitorId?: string;
  userId?: string;
  anonymousId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, unknown>;
  source?: string;
  referrer?: string;
  utmParams?: Record<string, string>;
  country?: string;
  region?: string;
  city?: string;
}

export interface RecordInteractionDto {
  type: InteractionType;
  componentId?: string;
  optionId?: string;
  previousOptionId?: string;
  cameraPosition?: Record<string, unknown>;
  cameraTarget?: Record<string, unknown>;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class Configurator3DSessionService {
  private readonly logger = new Logger(Configurator3DSessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly pricingService: Configurator3DPricingService,
  ) {}

  private generateSessionId(): string {
    return `cfg3d_${randomBytes(16).toString('hex')}`;
  }

  @CacheInvalidate({
    tags: (args) => [`configurator-3d:${args[0]}`, 'configurator-3d-sessions:list'],
  })
  async start(dto: StartSessionDto) {
    const config = await this.prisma.configurator3DConfiguration.findUnique({
      where: { id: dto.configurationId },
      select: { id: true, brandId: true, isActive: true, status: true },
    });

    if (!config) {
      throw new NotFoundException(
        `Configurator 3D configuration with ID ${dto.configurationId} not found`,
      );
    }

    if (!config.isActive) {
      throw new BadRequestException(
        'Configurator 3D configuration is not active',
      );
    }

    const sessionId = this.generateSessionId();

    const session = await this.prisma.configurator3DSession.create({
      data: {
        configurationId: dto.configurationId,
        sessionId,
        visitorId: dto.visitorId,
        userId: dto.userId,
        anonymousId: dto.anonymousId,
        status: Configurator3DSessionStatus.ACTIVE,
        state: {} as Prisma.InputJsonValue,
        selections: {} as Prisma.InputJsonValue,
        selectedOptions: {} as Prisma.InputJsonValue,
        deviceInfo:
          typeof dto.deviceInfo === 'object' && dto.deviceInfo !== null
            ? JSON.stringify(dto.deviceInfo)
            : '{}',
        ipAddress: dto.ipAddress,
        source: dto.source,
        referrer: dto.referrer,
        utmParams: (dto.utmParams || {}) as Prisma.InputJsonValue,
        country: dto.country,
        region: dto.region,
        city: dto.city,
      },
      include: {
        configuration: {
          select: {
            id: true,
            name: true,
            slug: true,
            sceneConfig: true,
            uiConfig: true,
            modelUrl: true,
            enablePricing: true,
          },
        },
      },
    });

    await this.prisma.configurator3DConfiguration.update({
      where: { id: dto.configurationId },
      data: { sessionCount: { increment: 1 } },
    });

    this.logger.log(`Configurator 3D session started: ${sessionId}`);

    return session;
  }

  startSession(
    configurationId: string,
    visitorId: string,
    deviceInfo?: Record<string, unknown>,
  ) {
    return this.start({
      configurationId,
      visitorId,
      deviceInfo,
    });
  }

  @Cacheable({
    type: 'configurator-3d-session',
    ttl: 300,
    keyGenerator: (args) => `configurator-3d-session:${args[0]}`,
    tags: () => ['configurator-3d-sessions:list'],
  })
  async findOne(sessionId: string, accessControl?: { userId?: string; brandId?: string }) {
    const session = await this.prisma.configurator3DSession.findUnique({
      where: { sessionId },
      include: {
        configuration: {
          select: {
            id: true,
            name: true,
            slug: true,
            brandId: true,
            sceneConfig: true,
            uiConfig: true,
            modelUrl: true,
            enablePricing: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (accessControl?.brandId && session.configuration.brandId !== accessControl.brandId) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (accessControl?.userId && session.userId && session.userId !== accessControl.userId) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    return session;
  }

  @CacheInvalidate({
    tags: (args) => [`configurator-3d-session:${args[0]}`, 'configurator-3d-sessions:list'],
  })
  async update(
    sessionId: string,
    data: {
      selections?: Record<string, unknown>;
      selectedOptions?: Record<string, unknown>;
      state?: Record<string, unknown>;
      previewImageUrl?: string;
    },
  ) {
    const session = await this.prisma.configurator3DSession.findUnique({
      where: { sessionId },
      select: { id: true, configurationId: true, configuration: { select: { enablePricing: true } } },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    let calculatedPrice: number | undefined;
    let priceBreakdown: unknown;

    if (
      data.selections &&
      Object.keys(data.selections).length > 0 &&
      session.configuration.enablePricing
    ) {
      const priceResult = await this.pricingService.calculate(
        session.configurationId,
        data.selections as Record<string, string>,
      );
      calculatedPrice = priceResult.total;
      priceBreakdown = priceResult.breakdown;
    }

    const updated = await this.prisma.configurator3DSession.update({
      where: { sessionId },
      data: {
        ...(data.selections && { selections: data.selections as Prisma.InputJsonValue }),
        ...(data.selectedOptions && {
          selectedOptions: data.selectedOptions as Prisma.InputJsonValue,
        }),
        ...(data.state && { state: data.state as Prisma.InputJsonValue }),
        ...(data.previewImageUrl && { previewImageUrl: data.previewImageUrl }),
        ...(calculatedPrice !== undefined && { calculatedPrice }),
        ...(priceBreakdown !== undefined && {
          priceBreakdown: priceBreakdown as Prisma.InputJsonValue,
        }),
        lastActivityAt: new Date(),
      },
      include: {
        configuration: {
          select: {
            id: true,
            name: true,
            sceneConfig: true,
            uiConfig: true,
          },
        },
      },
    });

    return updated;
  }

  updateSession(
    sessionId: string,
    state: Record<string, unknown>,
    previewImageUrl?: string,
  ) {
    return this.update(sessionId, { state, previewImageUrl });
  }

  async recordInteraction(
    sessionId: string,
    interactions: RecordInteractionDto[],
  ) {
    const session = await this.prisma.configurator3DSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    await this.prisma.configurator3DInteraction.createMany({
      data: interactions.map((i) => ({
        sessionId: session.id,
        type: i.type,
        componentId: i.componentId,
        optionId: i.optionId,
        previousOptionId: i.previousOptionId,
        cameraPosition: (i.cameraPosition || {}) as Prisma.InputJsonValue,
        cameraTarget: (i.cameraTarget || {}) as Prisma.InputJsonValue,
        durationMs: i.durationMs,
        metadata: (i.metadata || {}) as Prisma.InputJsonValue,
      })),
    });

    return { success: true, count: interactions.length };
  }

  async saveConfiguration(
    sessionId: string,
    data: {
      name: string;
      description?: string;
      userId?: string;
      selections: Record<string, unknown>;
      savedPrice?: number;
      thumbnailUrl?: string;
    },
  ) {
    const session = await this.prisma.configurator3DSession.findUnique({
      where: { sessionId },
      select: { id: true, configurationId: true, calculatedPrice: true, currency: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const shareToken = randomBytes(12).toString('hex');

    const savedDesign = await this.prisma.configurator3DSavedDesign.create({
      data: {
        configurationId: session.configurationId,
        sessionId: session.id,
        userId: data.userId,
        name: data.name,
        description: data.description,
        selections: data.selections as Prisma.InputJsonValue,
        savedPrice: data.savedPrice ?? session.calculatedPrice,
        currency: session.currency,
        thumbnailUrl: data.thumbnailUrl,
        shareToken,
      },
    });

    await this.prisma.configurator3DSession.update({
      where: { sessionId },
      data: {
        status: Configurator3DSessionStatus.SAVED,
        savedAt: new Date(),
      },
    });

    this.logger.log(`Session ${sessionId} saved as design ${savedDesign.id}`);

    return {
      ...savedDesign,
      shareUrl: `/share/${shareToken}`,
    };
  }

  async saveSession(sessionId: string) {
    const session = await this.prisma.configurator3DSession.findUnique({
      where: { sessionId },
      select: { selections: true, calculatedPrice: true, currency: true },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    return this.saveConfiguration(sessionId, {
      name: `Design ${new Date().toISOString().slice(0, 10)}`,
      selections: (session.selections as Record<string, unknown>) || {},
      savedPrice: session.calculatedPrice ?? undefined,
    });
  }

  async complete(sessionId: string) {
    const session = await this.prisma.configurator3DSession.findUnique({
      where: { sessionId },
      select: { id: true, startedAt: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const durationMs = Date.now() - session.startedAt.getTime();

    await this.prisma.configurator3DSession.update({
      where: { sessionId },
      data: {
        status: Configurator3DSessionStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    return { success: true, durationMs };
  }

  async addToCart(
    sessionId: string,
    data: {
      orderId?: string;
      conversionValue?: number;
    },
  ) {
    const session = await this.prisma.configurator3DSession.findUnique({
      where: { sessionId },
      select: { id: true, configurationId: true, configuration: { select: { brandId: true } } },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    await this.prisma.configurator3DSession.update({
      where: { sessionId },
      data: {
        status: Configurator3DSessionStatus.CONVERTED,
        convertedAt: new Date(),
        conversionType: ConversionType.ADD_TO_CART,
        conversionValue: data.conversionValue,
        orderId: data.orderId,
      },
    });

    await this.prisma.configurator3DConfiguration.update({
      where: { id: session.configurationId },
      data: { conversionCount: { increment: 1 } },
    });

    this.eventEmitter.emit('configurator3d.add-to-cart', {
      sessionId,
      configurationId: session.configurationId,
      brandId: session.configuration.brandId,
      orderId: data.orderId,
      conversionValue: data.conversionValue,
    });

    this.logger.log(`Session ${sessionId} converted to cart`);

    return { success: true, conversionType: ConversionType.ADD_TO_CART };
  }

  async delete(sessionId: string, brandId: string) {
    const _session = await this.findOne(sessionId, { brandId });

    await this.prisma.configurator3DSession.delete({
      where: { sessionId },
    });

    this.logger.log(`Session ${sessionId} deleted by admin`);

    return { success: true, sessionId };
  }

  async findAll(
    brandId: string,
    params: PaginationParams & {
      configurationId?: string;
      status?: Configurator3DSessionStatus;
      from?: Date;
      to?: Date;
    } = {},
  ): Promise<PaginationResult<unknown>> {
    const { skip, take, page, limit } = normalizePagination(params);

    const where: Prisma.Configurator3DSessionWhereInput = {
      configuration: { brandId },
    };

    if (params.configurationId) {
      where.configurationId = params.configurationId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.from || params.to) {
      where.startedAt = {};
      if (params.from) where.startedAt.gte = params.from;
      if (params.to) where.startedAt.lte = params.to;
    }

    const [data, total] = await Promise.all([
      this.prisma.configurator3DSession.findMany({
        where,
        select: {
          id: true,
          sessionId: true,
          visitorId: true,
          userId: true,
          status: true,
          calculatedPrice: true,
          currency: true,
          startedAt: true,
          savedAt: true,
          completedAt: true,
          convertedAt: true,
          conversionType: true,
          configuration: {
            select: { id: true, name: true },
          },
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.configurator3DSession.count({ where }),
    ]);

    return createPaginationResult(data, total, { page, limit });
  }

  async getAnalytics(
    brandId: string | null | undefined,
    days: number = 30,
  ): Promise<{
    totalSessions: number;
    savedConfigs: number;
    avgSessionDuration: number;
    productsConfigured: number;
    sessionsOverTime: Array<{ date: string; count: number }>;
    topProducts: Array<{ productName: string; sessionCount: number }>;
    categoryBreakdown: Array<{ category: string; count: number }>;
  }> {
    const empty = {
      totalSessions: 0,
      savedConfigs: 0,
      avgSessionDuration: 0,
      productsConfigured: 0,
      sessionsOverTime: [] as Array<{ date: string; count: number }>,
      topProducts: [] as Array<{ productName: string; sessionCount: number }>,
      categoryBreakdown: [] as Array<{ category: string; count: number }>,
    };

    if (!brandId) return empty;

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const where = {
      configuration: { brandId },
      startedAt: { gte: since },
    };

    try {
      const [totalSessions, savedCount, sessions] = await Promise.all([
        this.prisma.configurator3DSession.count({ where }),
        this.prisma.configurator3DSession.count({
          where: { ...where, status: Configurator3DSessionStatus.SAVED },
        }),
        this.prisma.configurator3DSession.findMany({
          where,
          select: {
            startedAt: true,
            savedAt: true,
            completedAt: true,
            configuration: { select: { id: true, name: true, productId: true } },
          },
        }),
      ]);

      let totalDuration = 0;
      let durationCount = 0;
      for (const s of sessions) {
        const end = s.completedAt ?? s.savedAt;
        if (end) {
          totalDuration += (end.getTime() - s.startedAt.getTime()) / 1000;
          durationCount++;
        }
      }
      const avgSessionDuration =
        durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

      const productIds = new Set(
        sessions.map((s) => s.configuration.productId).filter(Boolean),
      );
      const productsConfigured = productIds.size;

      const dateMap = new Map<string, number>();
      for (const s of sessions) {
        const d = s.startedAt.toISOString().slice(0, 10);
        dateMap.set(d, (dateMap.get(d) ?? 0) + 1);
      }
      for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        if (!dateMap.has(key)) dateMap.set(key, 0);
      }
      const sessionsOverTime = Array.from(dateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));

      const configMap = new Map<string, { name: string; count: number }>();
      for (const s of sessions) {
        const key = s.configuration.id;
        const entry = configMap.get(key);
        if (entry) {
          entry.count++;
        } else {
          configMap.set(key, { name: s.configuration.name, count: 1 });
        }
      }
      const topProducts = Array.from(configMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((p) => ({ productName: p.name, sessionCount: p.count }));

      return {
        totalSessions,
        savedConfigs: savedCount,
        avgSessionDuration,
        productsConfigured,
        sessionsOverTime,
        topProducts,
        categoryBreakdown: [],
      };
    } catch (err) {
      this.logger.error('Failed to compute configurator analytics', err);
      return empty;
    }
  }
}
