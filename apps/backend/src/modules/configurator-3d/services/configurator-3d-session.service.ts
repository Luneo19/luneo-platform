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
