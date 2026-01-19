import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { CacheInvalidate } from '@/libs/cache/cacheable.decorator';

@Injectable()
export class TryOnScreenshotService {
  private readonly logger = new Logger(TryOnScreenshotService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

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
      // TODO: Implémenter génération thumbnail avec sharp
      thumbnailUrl = imageUrl; // Placeholder
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
   * Génère une URL partageable pour un screenshot
   */
  @CacheInvalidate({
    tags: (args) => [`try-on-screenshot:${args[0]}`],
  })
  async generateSharedUrl(id: string) {
    const screenshot = await this.findOne(id);

    // TODO: Générer URL partageable avec token unique
    const sharedUrl = `${process.env.APP_URL}/share/try-on/${screenshot.id}`;

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
