import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { CacheInvalidate } from '@/libs/cache/cacheable.decorator';
import sharp from 'sharp';

@Injectable()
export class TryOnScreenshotService {
  private readonly logger = new Logger(TryOnScreenshotService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  /**
   * SECURITY FIX: Verify that a screenshot belongs to the user's brand.
   * Traces screenshot → session → configuration → project → brand.
   */
  async verifyScreenshotOwnership(screenshotId: string, userBrandId: string | null | undefined): Promise<void> {
    if (!userBrandId) return; // Skip for admin/unauthenticated

    const screenshot = await this.prisma.tryOnScreenshot.findUnique({
      where: { id: screenshotId },
      select: {
        session: {
          select: {
            configuration: {
              select: {
                project: {
                  select: { brandId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!screenshot?.session?.configuration?.project) {
      throw new NotFoundException(`Screenshot ${screenshotId} not found`);
    }

    if (screenshot.session.configuration.project.brandId !== userBrandId) {
      this.logger.warn(`IDOR attempt: user brand ${userBrandId} tried to access screenshot ${screenshotId}`);
      throw new ForbiddenException('You do not have access to this screenshot');
    }
  }

  /**
   * Crée un screenshot pour une session
   */
  @CacheInvalidate({
    tags: (args) => [`try-on-session:${args[0]}`, 'try-on-screenshots:list'],
  })
  async create(
    sessionId: string,
    productId: string,
    imageData: Buffer,
    options?: {
      generateThumbnail?: boolean;
      generateSharedUrl?: boolean;
    },
  ) {
    // Vérifier que la session existe
    const session = await this.prisma.tryOnSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Upload de l'image
    const imageUrl = await this.storageService.uploadFile(
      `try-on/screenshots/${sessionId}/${Date.now()}.png`,
      imageData,
      'image/png',
    );

    // Générer thumbnail si demandé
    let thumbnailUrl: string | undefined;
    if (options?.generateThumbnail) {
      const thumbBuffer = await sharp(imageData)
        .resize(200, 200, { fit: 'cover' })
        .toBuffer();
      thumbnailUrl = await this.storageService.uploadFile(
        `try-on/screenshots/${sessionId}/${Date.now()}_thumb.png`,
        thumbBuffer,
        'image/png',
      );
    }

    // Créer le screenshot
    const screenshot = await this.prisma.tryOnScreenshot.create({
      data: {
        sessionId: session.id,
        productId,
        imageUrl,
        thumbnailUrl,
      },
      select: {
        id: true,
        imageUrl: true,
        thumbnailUrl: true,
        sharedUrl: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Mettre à jour le compteur de screenshots dans la session
    await this.prisma.tryOnSession.update({
      where: { id: session.id },
      data: {
        screenshotsTaken: {
          increment: 1,
        },
      },
    });

    this.logger.log(
      `Screenshot created: ${screenshot.id} for session ${sessionId}`,
    );

    return screenshot;
  }

  /**
   * Récupère un screenshot par son ID
   */
  async findOne(id: string) {
    const screenshot = await this.prisma.tryOnScreenshot.findUnique({
      where: { id },
      select: {
        id: true,
        imageUrl: true,
        thumbnailUrl: true,
        sharedUrl: true,
        createdAt: true,
        session: {
          select: {
            sessionId: true,
            visitorId: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
      },
    });

    if (!screenshot) {
      throw new NotFoundException(`Screenshot with ID ${id} not found`);
    }

    return screenshot;
  }

  /**
   * Liste les screenshots d'une session
   */
  async findAll(sessionId: string) {
    const session = await this.prisma.tryOnSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    return this.prisma.tryOnScreenshot.findMany({
      where: { sessionId: session.id },
      select: {
        id: true,
        imageUrl: true,
        thumbnailUrl: true,
        sharedUrl: true,
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Batch upload screenshots at the end of a session.
   * Processes in parallel for performance.
   */
  async createBatch(
    sessionId: string,
    screenshots: Array<{
      imageBase64: string;
      productId: string;
      metadata?: Record<string, unknown>;
    }>,
  ) {
    // Resolve session internal ID
    const session = await this.prisma.tryOnSession.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Process all screenshots in parallel
    const results = await Promise.allSettled(
      screenshots.map(async (item, index) => {
        // Decode base64
        const base64Data = item.imageBase64.replace(
          /^data:image\/\w+;base64,/,
          '',
        );
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Upload full image
        const timestamp = Date.now();
        const imageUrl = await this.storageService.uploadFile(
          `try-on/screenshots/${sessionId}/${timestamp}_${index}.png`,
          imageBuffer,
          'image/png',
        );

        // Generate thumbnail
        let thumbnailUrl: string | undefined;
        try {
          const thumbBuffer = await sharp(imageBuffer)
            .resize(200, 200, { fit: 'cover' })
            .toBuffer();
          thumbnailUrl = await this.storageService.uploadFile(
            `try-on/screenshots/${sessionId}/${timestamp}_${index}_thumb.png`,
            thumbBuffer,
            'image/png',
          );
        } catch (err) {
          this.logger.warn(
            `Thumbnail generation failed for batch item ${index}: ${err}`,
          );
        }

        return {
          sessionId: session.id,
          productId: item.productId,
          imageUrl,
          thumbnailUrl: thumbnailUrl || null,
          metadata: item.metadata || null,
        };
      }),
    );

    // Filter successful uploads
    const successfulData = results
      .filter(
        (r): r is PromiseFulfilledResult<{
          sessionId: string;
          productId: string;
          imageUrl: string;
          thumbnailUrl: string | null;
          metadata: Record<string, unknown> | null;
        }> => r.status === 'fulfilled',
      )
      .map((r) => r.value);

    const failedCount = results.filter((r) => r.status === 'rejected').length;

    if (successfulData.length === 0) {
      throw new BadRequestException('All screenshot uploads failed');
    }

    // Batch create in database
    await this.prisma.tryOnScreenshot.createMany({
      data: successfulData.map((d) => ({
        sessionId: d.sessionId,
        productId: d.productId,
        imageUrl: d.imageUrl,
        thumbnailUrl: d.thumbnailUrl,
        metadata: d.metadata as object | undefined,
      })),
    });

    // Update session screenshot count
    await this.prisma.tryOnSession.update({
      where: { id: session.id },
      data: {
        screenshotsTaken: {
          increment: successfulData.length,
        },
      },
    });

    this.logger.log(
      `Batch screenshots: ${successfulData.length} created, ${failedCount} failed for session ${sessionId}`,
    );

    return {
      created: successfulData.length,
      failed: failedCount,
      total: screenshots.length,
    };
  }

  /**
   * Génère une URL partageable pour un screenshot
   */
  @CacheInvalidate({
    tags: (args) => [`try-on-screenshot:${args[0]}`],
  })
  async generateSharedUrl(id: string) {
    const screenshot = await this.findOne(id);

    const token = randomBytes(32).toString('hex');
    const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
    const sharedUrl = `${baseUrl}/share/try-on/${screenshot.id}?token=${token}`;

    const updated = await this.prisma.tryOnScreenshot.update({
      where: { id },
      data: { sharedUrl },
      select: {
        id: true,
        sharedUrl: true,
        createdAt: true,
      },
    });

    this.logger.log(`Shared URL generated for screenshot: ${id}`);

    return updated;
  }
}
