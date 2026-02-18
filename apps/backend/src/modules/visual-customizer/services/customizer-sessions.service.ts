import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, CustomizerInteractionType } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import {
  normalizePagination,
  createPaginationResult,
  PaginationParams,
  PaginationResult,
} from '@/libs/prisma/pagination.helper';
import { StartSessionDto } from '../dto/sessions/start-session.dto';
import { SaveDesignDto } from '../dto/sessions/save-design.dto';
import { SessionInteractionDto } from '../dto/sessions/session-interaction.dto';
import { VISUAL_CUSTOMIZER_LIMITS } from '../visual-customizer.constants';
import { CurrentUser } from '@/common/types/user.types';

interface Auth {
  userId?: string;
  anonymousId?: string;
}

@Injectable()
export class CustomizerSessionsService {
  private readonly logger = new Logger(CustomizerSessionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start a new session
   */
  async start(data: StartSessionDto & { userId?: string; anonymousId?: string }) {
    // Verify customizer exists and is published
    const customizer = await this.prisma.visualCustomizer.findFirst({
      where: {
        id: data.customizerId,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!customizer) {
      throw new NotFoundException(
        `Published customizer with ID ${data.customizerId} not found`,
      );
    }

    const session = await this.prisma.customizerSession.create({
      data: {
        customizerId: data.customizerId,
        userId: data.userId,
        anonymousId: data.anonymousId,
        source: data.source,
        referrer: data.referrer,
        status: 'ACTIVE',
      },
    });

    // Increment customizer session count
    await this.prisma.visualCustomizer.update({
      where: { id: data.customizerId },
      data: {
        sessionCount: { increment: 1 },
      },
    });

    this.logger.log(`Session started: ${session.id} for customizer ${data.customizerId}`);

    return session;
  }

  /**
   * Find one session by ID
   */
  async findOne(id: string, auth: Auth) {
    const session = await this.prisma.customizerSession.findFirst({
      where: {
        id,
        OR: [
          { userId: auth.userId },
          { anonymousId: auth.anonymousId },
        ],
      },
      include: {
        customizer: {
          select: {
            id: true,
            name: true,
            slug: true,
            canvasWidth: true,
            canvasHeight: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  /**
   * Update session canvas data
   */
  async update(
    id: string,
    dto: { canvasData?: Prisma.InputJsonValue },
    user: CurrentUser,
  ) {
    const session = await this.prisma.customizerSession.findFirst({
      where: {
        id,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    const updated = await this.prisma.customizerSession.update({
      where: { id },
      data: {
        canvasData: dto.canvasData,
        lastActivityAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Record an interaction
   */
  async recordInteraction(id: string, dto: SessionInteractionDto) {
    const session = await this.prisma.customizerSession.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    const interaction = await this.prisma.customizerInteraction.create({
      data: {
        sessionId: id,
        type: dto.type as CustomizerInteractionType,
        zoneId: dto.zoneId,
        layerId: dto.layerId,
        toolUsed: dto.toolUsed,
        data: dto.data as unknown as Prisma.InputJsonValue,
        durationMs: dto.durationMs,
      },
    });

    // Update session last activity
    await this.prisma.customizerSession.update({
      where: { id },
      data: { lastActivityAt: new Date() },
    });

    return interaction;
  }

  /**
   * Save a design
   */
  async saveDesign(sessionId: string, dto: SaveDesignDto, user: CurrentUser) {
    const session = await this.prisma.customizerSession.findFirst({
      where: {
        id: sessionId,
        OR: [
          { userId: user.id },
          { anonymousId: user.id ? undefined : sessionId }, // Allow anonymous sessions if no userId
        ],
      },
      include: {
        customizer: {
          select: { id: true, brandId: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Check max saved designs limit
    if (user.id) {
      const savedCount = await this.prisma.customizerSavedDesign.count({
        where: {
          userId: user.id,
          deletedAt: null,
        },
      });

      if (savedCount >= VISUAL_CUSTOMIZER_LIMITS.MAX_SAVED_DESIGNS_PER_USER) {
        throw new BadRequestException(
          `Maximum ${VISUAL_CUSTOMIZER_LIMITS.MAX_SAVED_DESIGNS_PER_USER} saved designs allowed per user`,
        );
      }
    }

    // Generate share token
    const shareToken = this.generateShareToken();

    const savedDesign = await this.prisma.customizerSavedDesign.create({
      data: {
        customizerId: session.customizerId,
        sessionId,
        userId: user.id,
        name: dto.name,
        description: dto.description,
        canvasData: dto.canvasData as Prisma.InputJsonValue,
        thumbnailUrl: dto.thumbnailDataUrl,
        isPublic: dto.isPublic ?? false,
        allowRemix: dto.allowRemix ?? false,
        shareToken,
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/designs/${shareToken}`,
      },
    });

    // Increment customizer designs saved count
    await this.prisma.visualCustomizer.update({
      where: { id: session.customizerId },
      data: {
        designsSaved: { increment: 1 },
      },
    });

    this.logger.log(`Design saved: ${savedDesign.id} for session ${sessionId}`);

    return savedDesign;
  }

  /**
   * Complete a session
   */
  async complete(sessionId: string, user: CurrentUser) {
    const session = await this.prisma.customizerSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const updated = await this.prisma.customizerSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    this.logger.log(`Session completed: ${sessionId}`);

    return updated;
  }

  /**
   * Add design to cart (returns cart integration data)
   */
  async addToCart(sessionId: string, quantity: number, user: CurrentUser) {
    const session = await this.prisma.customizerSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
      include: {
        customizer: {
          select: {
            id: true,
            productId: true,
            pricingEnabled: true,
            basePrice: true,
            currency: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Calculate price
    const price = session.calculatedPrice || session.customizer.basePrice || 0;

    // Record conversion
    await this.prisma.customizerSession.update({
      where: { id: sessionId },
      data: {
        convertedAt: new Date(),
        conversionType: 'ADD_TO_CART',
        conversionValue: price * quantity,
      },
    });

    return {
      sessionId,
      customizerId: session.customizerId,
      quantity,
      unitPrice: price,
      totalPrice: price * quantity,
      currency: session.customizer.currency,
      cartData: {
        // Integration data for cart system
        productId: session.customizer.productId,
        variantId: sessionId,
        customizations: session.canvasData,
      },
    };
  }

  /**
   * List saved designs for a user
   */
  async listSavedDesigns(
    user: CurrentUser,
    query: PaginationParams & { customizerId?: string } = {},
  ): Promise<PaginationResult<unknown>> {
    const { skip, take, page, limit } = normalizePagination(query);

    const where: Prisma.CustomizerSavedDesignWhereInput = {
      userId: user.id,
      deletedAt: null,
      ...(query.customizerId && { customizerId: query.customizerId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.customizerSavedDesign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          customizer: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      this.prisma.customizerSavedDesign.count({ where }),
    ]);

    return createPaginationResult(data, total, { page, limit });
  }

  /**
   * Get one saved design
   */
  async getSavedDesign(id: string, user: CurrentUser) {
    const design = await this.prisma.customizerSavedDesign.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: null,
      },
      include: {
        customizer: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!design) {
      throw new NotFoundException(`Saved design with ID ${id} not found`);
    }

    return design;
  }

  /**
   * Get shared design by token (public)
   */
  async getSharedDesign(token: string) {
    const design = await this.prisma.customizerSavedDesign.findFirst({
      where: {
        shareToken: token,
        isPublic: true,
        moderationStatus: 'APPROVED',
        deletedAt: null,
      },
      include: {
        customizer: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!design) {
      throw new NotFoundException(`Shared design with token ${token} not found`);
    }

    // Increment view count
    await this.prisma.customizerSavedDesign.update({
      where: { id: design.id },
      data: { viewCount: { increment: 1 } },
    });

    return design;
  }

  /**
   * Update saved design
   */
  async updateSavedDesign(
    id: string,
    dto: Partial<SaveDesignDto>,
    user: CurrentUser,
  ) {
    const design = await this.getSavedDesign(id, user);

    const updateData: Prisma.CustomizerSavedDesignUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    if (dto.canvasData !== undefined) {
      updateData.canvasData = dto.canvasData as Prisma.InputJsonValue;
    }

    if (dto.thumbnailDataUrl !== undefined) {
      updateData.thumbnailUrl = dto.thumbnailDataUrl;
    }

    if (dto.isPublic !== undefined) {
      updateData.isPublic = dto.isPublic;
    }

    if (dto.allowRemix !== undefined) {
      updateData.allowRemix = dto.allowRemix;
    }

    const updated = await this.prisma.customizerSavedDesign.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Saved design updated: ${id}`);

    return updated;
  }

  /**
   * Delete saved design
   */
  async deleteSavedDesign(id: string, user: CurrentUser) {
    const design = await this.getSavedDesign(id, user);

    await this.prisma.customizerSavedDesign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Saved design deleted: ${id}`);

    return {
      success: true,
      id,
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate share link
   */
  async generateShareLink(
    id: string,
    expiresInDays: number = 30,
    user: CurrentUser,
  ) {
    const design = await this.getSavedDesign(id, user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const updated = await this.prisma.customizerSavedDesign.update({
      where: { id },
      data: {
        isPublic: true,
        expiresAt,
      },
    });

    return {
      shareUrl: updated.shareUrl,
      shareToken: updated.shareToken,
      expiresAt: updated.expiresAt,
    };
  }

  /**
   * Generate unique share token
   */
  private generateShareToken(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
