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
        deviceInfo: (deviceInfo || {}) as Record<string, unknown>,
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
}
