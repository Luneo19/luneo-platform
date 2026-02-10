import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Configurator3DSessionStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';
import { randomBytes } from 'crypto';

@Injectable()
export class Configurator3DSessionService {
  private readonly logger = new Logger(Configurator3DSessionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Génère un ID de session unique
   */
  private generateSessionId(): string {
    return `cfg3d_${randomBytes(16).toString('hex')}`;
  }

  /**
   * Démarre une nouvelle session configurator
   */
  @CacheInvalidate({
    tags: (args) => [`configurator-3d:${args[0]}`, 'configurator-3d-sessions:list'],
  })
  async startSession(
    configurationId: string,
    visitorId: string,
    deviceInfo?: Record<string, unknown>,
  ) {
    // Vérifier que la configuration existe
    const config = await this.prisma.configurator3DConfiguration.findUnique({
      where: { id: configurationId },
      select: { id: true, isActive: true },
    });

    if (!config) {
      throw new NotFoundException(
        `Configurator 3D configuration with ID ${configurationId} not found`,
      );
    }

    if (!config.isActive) {
      throw new BadRequestException('Configurator 3D configuration is not active');
    }

    const sessionId = this.generateSessionId();

    const session = await this.prisma.configurator3DSession.create({
      data: {
        configurationId,
        sessionId,
        visitorId,
        status: Configurator3DSessionStatus.ACTIVE,
        state: {} as Prisma.InputJsonValue,
        deviceInfo: typeof deviceInfo === 'object' && deviceInfo !== null ? JSON.stringify(deviceInfo) : (String(deviceInfo ?? '{}')),
      },
      select: {
        id: true,
        sessionId: true,
        visitorId: true,
        status: true,
        startedAt: true,
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

    this.logger.log(`Configurator 3D session started: ${sessionId}`);

    return session;
  }

  /**
   * Met à jour l'état d'une session
   */
  @CacheInvalidate({
    tags: (args) => [`configurator-3d-session:${args[0]}`, 'configurator-3d-sessions:list'],
  })
  async updateSession(
    sessionId: string,
    state: Record<string, unknown>,
    previewImageUrl?: string,
  ) {
    const session = await this.prisma.configurator3DSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const updated = await this.prisma.configurator3DSession.update({
      where: { id: session.id },
      data: {
        state: state as Prisma.InputJsonValue,
        previewImageUrl,
      },
      select: {
        id: true,
        sessionId: true,
        status: true,
        state: true,
        previewImageUrl: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /**
   * Sauvegarde une session
   */
  @CacheInvalidate({
    tags: (args) => [`configurator-3d-session:${args[0]}`, 'configurator-3d-sessions:list'],
  })
  async saveSession(sessionId: string) {
    const session = await this.prisma.configurator3DSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const saved = await this.prisma.configurator3DSession.update({
      where: { id: session.id },
      data: {
        status: Configurator3DSessionStatus.SAVED,
        savedAt: new Date(),
      },
      select: {
        id: true,
        sessionId: true,
        status: true,
        savedAt: true,
      },
    });

    this.logger.log(`Configurator 3D session saved: ${sessionId}`);

    return saved;
  }

  /**
   * Analytics agrégées du configurateur 3D pour une marque
   */
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

    if (!brandId) {
      return empty;
    }

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
          where: { ...where, status: 'SAVED' as Configurator3DSessionStatus },
        }),
        this.prisma.configurator3DSession.findMany({
          where,
          select: {
            startedAt: true,
            savedAt: true,
            completedAt: true,
            configuration: {
              select: { id: true, name: true, productId: true },
            },
          },
        }),
      ]);

      // Avg session duration (startedAt -> completedAt or savedAt)
      let totalDuration = 0;
      let durationCount = 0;
      for (const s of sessions) {
        const end = s.completedAt ?? s.savedAt;
        if (end) {
          totalDuration += (end.getTime() - s.startedAt.getTime()) / 1000;
          durationCount++;
        }
      }
      const avgSessionDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

      // Unique products configured
      const productIds = new Set(sessions.map(s => s.configuration.productId).filter(Boolean));
      const productsConfigured = productIds.size;

      // Sessions over time
      const dateMap = new Map<string, number>();
      for (const s of sessions) {
        const d = s.startedAt.toISOString().slice(0, 10);
        dateMap.set(d, (dateMap.get(d) ?? 0) + 1);
      }
      // Fill in missing dates
      for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        if (!dateMap.has(key)) dateMap.set(key, 0);
      }
      const sessionsOverTime = Array.from(dateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));

      // Top products by session count
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
        .map(p => ({ productName: p.name, sessionCount: p.count }));

      return {
        totalSessions,
        savedConfigs: savedCount,
        avgSessionDuration,
        productsConfigured,
        sessionsOverTime,
        topProducts,
        categoryBreakdown: [], // No category field in Configurator3DConfiguration schema; extend later
      };
    } catch (err) {
      this.logger.error('Failed to compute configurator analytics', err);
      return empty;
    }
  }

  /**
   * Récupère une session par son ID
   */
  @Cacheable({
    type: 'configurator-3d-session',
    ttl: 300,
    keyGenerator: (args) => `configurator-3d-session:${args[0]}`,
    tags: () => ['configurator-3d-sessions:list'],
  })
  async findOne(sessionId: string) {
    const session = await this.prisma.configurator3DSession.findUnique({
      where: { sessionId },
      select: {
        id: true,
        sessionId: true,
        visitorId: true,
        status: true,
        state: true,
        previewImageUrl: true,
        deviceInfo: true,
        startedAt: true,
        savedAt: true,
        completedAt: true,
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

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    return session;
  }
}
