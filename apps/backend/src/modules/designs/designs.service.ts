import { CurrentUser } from '@/common/types/user.types';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, Optional, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DesignStatus, Prisma, UserRole } from '@prisma/client';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import * as sharp from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
import { firstValueFrom } from 'rxjs';
import { PlansService } from '@/modules/plans/plans.service';
import { QuotasService } from '@/modules/usage-billing/services/quotas.service';
import { UsageTrackingService } from '@/modules/usage-billing/services/usage-tracking.service';
import { CreditsService } from '@/libs/credits/credits.service';
import { ZapierService } from '@/modules/integrations/zapier/zapier.service';

@Injectable()
export class DesignsService {
  private readonly logger = new Logger(DesignsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('ai-generation') private aiQueue: Queue,
    private readonly storageService: StorageService,
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => PlansService)) private plansService: PlansService,
    private readonly quotasService: QuotasService,
    private readonly usageTrackingService: UsageTrackingService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => CreditsService)) private readonly creditsService: CreditsService,
    @Optional() private readonly zapierService?: ZapierService,
  ) {}

  @CacheInvalidate({ 
    type: 'design',
    tags: (args) => {
      const user = args[1] as { id: string; brandId?: string | null };
      return ['designs:list', user.brandId ? `brand:${user.brandId}` : null].filter(Boolean) as string[];
    },
  })
  async create(createDesignDto: { productId: string; prompt: string; options?: Record<string, unknown> }, currentUser: { id: string; role: UserRole; brandId?: string | null }) {
    const { productId, prompt, options } = createDesignDto;

    // Optimisé: select au lieu de include
    // Check if product exists and user has access
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        brandId: true,
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== product.brandId) {
      throw new ForbiddenException('Access denied to this product');
    }

    // Enforce design limit based on plan
    await this.plansService.enforceDesignLimit(currentUser.id);
    // Enforce usage-billing quota (designs_created)
    await this.quotasService.enforceQuota(product.brandId, 'designs_created');

    // Optimisé: select au lieu de include
    // Create design record (cache invalidé automatiquement)
    const design = await this.prisma.design.create({
      data: {
        prompt,
        options: (options ?? {}) as Prisma.InputJsonValue,
        status: DesignStatus.PENDING,
        userId: currentUser.id,
        brandId: product.brandId,
        productId,
      },
      select: {
        id: true,
        prompt: true,
        options: true,
        status: true,
        userId: true,
        brandId: true,
        productId: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.usageTrackingService.trackDesignCreated(product.brandId, design.id);

    this.zapierService?.triggerEvent(product.brandId, 'new_design', design as unknown as Record<string, unknown>).catch((err) => this.logger.warn('Non-critical error triggering Zapier new_design', err instanceof Error ? err.message : String(err)));

    // Add to AI generation queue
    await this.aiQueue.add('generate-design', {
      designId: design.id,
      prompt,
      options,
      userId: currentUser.id,
      brandId: product.brandId,
    });

    return design;
  }

  /** J2: Commandes issues d'un design */
  async getOrdersByDesign(designId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        OR: [
          { designId },
          { items: { some: { designId } } },
        ],
      },
      select: {
        id: true,
        status: true,
        designId: true,
        orderNumber: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { data: orders };
  }

  @Cacheable({ 
    type: 'design', 
    ttl: 300, // 5 minutes
    keyGenerator: (args) => {
      const user = args[0] as { id: string; brandId?: string | null };
      const options = (args[1] || {}) as { page?: number; limit?: number; status?: string; search?: string };
      const key = `designs:list:${user.id}:${user.brandId || 'all'}:${options.page || 1}:${options.limit || 50}:${options.status || 'all'}:${options.search || ''}`;
      return key;
    },
    tags: (args) => {
      const user = args[0] as { id: string; brandId?: string | null };
      return ['designs:list', user.brandId ? `brand:${user.brandId}` : null].filter(Boolean) as string[];
    },
  })
  async findAll(currentUser: { id: string; role: UserRole; brandId?: string | null }, options?: { page?: number; limit?: number; status?: string; search?: string }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.DesignWhereInput = {};

    // Filter by brand if user is not platform admin
    if (currentUser.role !== UserRole.PLATFORM_ADMIN) {
      where.brandId = currentUser.brandId ?? undefined;
    }

    // Filter by status if provided
    if (options?.status) {
      where.status = options.status as DesignStatus;
    }

    // Search filter (on name or prompt)
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { prompt: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [designs, total] = await Promise.all([
      this.prisma.design.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          prompt: true,
          status: true,
          previewUrl: true,
          imageUrl: true,
          userId: true,
          brandId: true,
          productId: true,
          createdAt: true,
          updatedAt: true,
          product: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.design.count({ where }),
    ]);

    return {
      designs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  // Optimisé: select au lieu de include, cache automatique
  @Cacheable({ 
    type: 'design', 
    ttl: 900,
    keyGenerator: (args) => `design:${args[0]}`,
    tags: () => ['designs:list'],
  })
  /**
   * Vérifie qu'un design n'est pas bloqué (réclamation IP). Lance ForbiddenException si bloqué.
   */
  private assertDesignNotBlocked(design: { isBlocked?: boolean }): void {
    if (design.isBlocked) {
      throw new ForbiddenException(
        'This design is blocked due to an IP claim and cannot be modified or used.',
      );
    }
  }

  async findOne(id: string, currentUser: { id: string; role: UserRole; brandId?: string | null }) {
    const design = await this.prisma.design.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        prompt: true,
        options: true,
        status: true,
        previewUrl: true,
        highResUrl: true,
        imageUrl: true,
        renderUrl: true,
        metadata: true,
        designData: true,
        canvasWidth: true,
        canvasHeight: true,
        canvasBackgroundColor: true,
        isBlocked: true,
        blockedReason: true,
        blockedAt: true,
        blockedByClaimId: true,
        userId: true,
        brandId: true,
        productId: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    // Check permissions
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== design.brandId) {
      throw new ForbiddenException('Access denied to this design');
    }

    return design;
  }

  async upgradeToHighRes(id: string, currentUser: CurrentUser) {
    const design = await this.findOne(id, currentUser);
    this.assertDesignNotBlocked(design);

    if (design.status !== DesignStatus.COMPLETED) {
      throw new ForbiddenException('Design must be completed to upgrade to high-res');
    }

    // CRITICAL: Check credits before queueing high-res generation (10 credits for HD)
    if (this.creditsService) {
      const check = await this.creditsService.checkCredits(currentUser.id, '/api/ai/generate/hd');
      if (!check.sufficient) {
        const packs = await this.creditsService.getAvailablePacks();
        throw new ForbiddenException({
          message: `Crédits insuffisants pour la génération HD. Requis: ${check.required}, Disponible: ${check.balance}`,
          code: 'INSUFFICIENT_CREDITS',
          balance: check.balance,
          required: check.required,
          missing: check.missing,
          upsell: { packs },
        });
      }
      await this.creditsService.deductCredits(currentUser.id, '/api/ai/generate/hd', {
        designId: design.id,
        action: 'upgrade_to_highres',
      });
    }

    // Add to high-res generation queue
    await this.aiQueue.add('generate-high-res', {
      designId: design.id,
      prompt: design.prompt,
      options: design.options,
      userId: currentUser.id,
    });

    return { message: 'High-res generation started' };
  }

  @Cacheable({ 
    type: 'design', 
    ttl: 600, // 10 minutes
    keyGenerator: (args) => {
      const designId = args[0];
      const options = (args[2] || {}) as { page?: number; limit?: number; autoOnly?: boolean };
      return `design:versions:${designId}:${options.page || 1}:${options.limit || 50}:${options.autoOnly || false}`;
    },
    tags: (args) => [`design:${args[0]}`, 'designs:versions'],
  })
  async getVersions(designId: string, currentUser: CurrentUser, options?: { page?: number; limit?: number; autoOnly?: boolean }) {
    const design = await this.findOne(designId, currentUser);

    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.DesignVersionWhereInput = { designId };
    if (options?.autoOnly) {
      where.isAutoSave = true;
    }

    const [versions, total] = await Promise.all([
      this.prisma.designVersion.findMany({
        where,
        select: {
          id: true,
          versionNumber: true,
          name: true,
          description: true,
          previewUrl: true,
          highResUrl: true,
          imageUrl: true,
          isAutoSave: true,
          createdAt: true,
          createdBy: true,
        },
        orderBy: { versionNumber: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.designVersion.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      design_id: designId,
      design_name: design.name || design.prompt?.substring(0, 50) || 'Untitled Design',
      versions: versions.map((v) => ({
        id: v.id,
        version_number: v.versionNumber,
        name: v.name,
        description: v.description,
        preview_url: v.previewUrl,
        high_res_url: v.highResUrl,
        image_url: v.imageUrl,
        is_auto_save: v.isAutoSave,
        created_at: v.createdAt,
        created_by: v.createdBy,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  @CacheInvalidate({ 
    type: 'design',
    tags: (args) => [`design:${args[0]}`, 'designs:versions'],
  })
  async createVersion(designId: string, data: { name?: string; description?: string }, currentUser: CurrentUser) {
    // Vérifier les permissions et récupérer le design complet
    await this.findOne(designId, currentUser);

    // Récupérer le design complet avec tous les champs nécessaires
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: {
        name: true,
        description: true,
        prompt: true,
        options: true,
        status: true,
        previewUrl: true,
        highResUrl: true,
        imageUrl: true,
        renderUrl: true,
        metadata: true,
        designData: true,
        canvasWidth: true,
        canvasHeight: true,
        canvasBackgroundColor: true,
      },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    // Get current highest version number
    const latestVersion = await this.prisma.designVersion.findFirst({
      where: { designId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Create version snapshot
    const version = await this.prisma.designVersion.create({
      data: {
        designId,
        versionNumber: nextVersionNumber,
        name: data.name,
        description: data.description,
        prompt: design.prompt,
        options: design.options as Prisma.InputJsonValue,
        previewUrl: design.previewUrl || null,
        highResUrl: design.highResUrl || null,
        imageUrl: design.imageUrl || null,
        renderUrl: design.renderUrl || null,
        metadata: design.metadata as Prisma.InputJsonValue,
        designData: (design.designData ?? null) as Prisma.InputJsonValue,
        isAutoSave: false,
        snapshot: {
          name: design.name,
          description: design.description,
          prompt: design.prompt,
          options: design.options,
          status: design.status,
          previewUrl: design.previewUrl,
          highResUrl: design.highResUrl,
          imageUrl: design.imageUrl,
          renderUrl: design.renderUrl,
          metadata: design.metadata,
          designData: design.designData,
          canvasWidth: design.canvasWidth,
          canvasHeight: design.canvasHeight,
          canvasBackgroundColor: design.canvasBackgroundColor,
        } as Prisma.InputJsonValue,
        createdBy: currentUser.id,
      },
      select: {
        id: true,
        versionNumber: true,
        name: true,
        description: true,
        previewUrl: true,
        highResUrl: true,
        imageUrl: true,
        isAutoSave: true,
        createdAt: true,
      },
    });

    return {
      id: version.id,
      version_number: version.versionNumber,
      name: version.name,
      description: version.description,
      preview_url: version.previewUrl,
      high_res_url: version.highResUrl,
      image_url: version.imageUrl,
      is_auto_save: version.isAutoSave,
      created_at: version.createdAt,
    };
  }

  @CacheInvalidate({ 
    type: 'design',
    tags: (args) => {
      const designId = args[0];
      return [`design:${designId}`, 'designs:list'];
    },
  })
  async update(id: string, data: { name?: string; description?: string; status?: DesignStatus; designData?: Record<string, unknown> }, currentUser: CurrentUser) {
    const design = await this.findOne(id, currentUser);
    this.assertDesignNotBlocked(design);

    const updated = await this.prisma.design.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.designData !== undefined && { designData: data.designData as unknown as Prisma.InputJsonValue }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        previewUrl: true,
        imageUrl: true,
        userId: true,
        brandId: true,
        productId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    this.zapierService?.triggerEvent(updated.brandId, 'design_updated', updated as unknown as Record<string, unknown>).catch((err) => this.logger.warn('Non-critical error triggering Zapier design_updated', err instanceof Error ? err.message : String(err)));
    return updated;
  }

  /**
   * Autosave périodique d'un design
   * Crée une version automatique du design toutes les X secondes (configurable)
   * Limite le nombre de versions autosave (garde les 10 dernières)
   */
  async autosave(designId: string, currentUser: CurrentUser): Promise<{ success: boolean; versionId?: string; message: string }> {
    // Vérifier les permissions
    const design = await this.findOne(designId, currentUser);
    this.assertDesignNotBlocked(design);

    // Récupérer le design complet avec tous les champs nécessaires
    const fullDesign = await this.prisma.design.findUnique({
      where: { id: designId },
      select: {
        name: true,
        description: true,
        prompt: true,
        options: true,
        status: true,
        previewUrl: true,
        highResUrl: true,
        imageUrl: true,
        renderUrl: true,
        metadata: true,
        designData: true,
        canvasWidth: true,
        canvasHeight: true,
        canvasBackgroundColor: true,
      },
    });

    if (!fullDesign) {
      throw new NotFoundException('Design not found');
    }

    // Vérifier si un autosave récent existe (dans les 30 dernières secondes)
    const recentAutosave = await this.prisma.designVersion.findFirst({
      where: {
        designId,
        isAutoSave: true,
        createdAt: {
          gte: new Date(Date.now() - 30 * 1000), // 30 secondes
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentAutosave) {
      return {
        success: false,
        message: 'Autosave récent déjà effectué. Attendez 30 secondes.',
      };
    }

    // Get current highest version number
    const latestVersion = await this.prisma.designVersion.findFirst({
      where: { designId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Create autosave version
    const autosaveVersion = await this.prisma.designVersion.create({
      data: {
        designId,
        versionNumber: nextVersionNumber,
        prompt: fullDesign.prompt,
        options: fullDesign.options as Prisma.InputJsonValue,
        previewUrl: fullDesign.previewUrl || null,
        highResUrl: fullDesign.highResUrl || null,
        imageUrl: fullDesign.imageUrl || null,
        renderUrl: fullDesign.renderUrl || null,
        metadata: fullDesign.metadata as Prisma.InputJsonValue,
        designData: (fullDesign.designData ?? null) as Prisma.InputJsonValue,
        isAutoSave: true,
        snapshot: {
          name: fullDesign.name,
          description: fullDesign.description,
          prompt: fullDesign.prompt,
          options: fullDesign.options,
          status: fullDesign.status,
          previewUrl: fullDesign.previewUrl,
          highResUrl: fullDesign.highResUrl,
          imageUrl: fullDesign.imageUrl,
          renderUrl: fullDesign.renderUrl,
          metadata: fullDesign.metadata,
          designData: fullDesign.designData,
          canvasWidth: fullDesign.canvasWidth,
          canvasHeight: fullDesign.canvasHeight,
          canvasBackgroundColor: fullDesign.canvasBackgroundColor,
        } as Prisma.InputJsonValue,
        createdBy: currentUser.id,
      },
      select: {
        id: true,
        versionNumber: true,
        isAutoSave: true,
        createdAt: true,
      },
    });

    // Nettoyer les anciennes versions autosave (garder les 10 dernières)
    const autosaveVersions = await this.prisma.designVersion.findMany({
      where: {
        designId,
        isAutoSave: true,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
      skip: 10, // Garder les 10 premières, supprimer le reste
      take: 100,
    });

    if (autosaveVersions.length > 0) {
      await this.prisma.designVersion.deleteMany({
        where: {
          id: { in: autosaveVersions.map((v) => v.id) },
        },
      });
    }

    this.logger.log(`Autosave created for design ${designId}`, {
      designId,
      versionId: autosaveVersion.id,
      versionNumber: autosaveVersion.versionNumber,
    });

    return {
      success: true,
      versionId: autosaveVersion.id,
      message: 'Design autosaved successfully',
    };
  }

  @CacheInvalidate({ 
    type: 'design',
    tags: (args) => {
      const designId = args[0];
      return [`design:${designId}`, 'designs:list'];
    },
  })
  async delete(id: string, currentUser: CurrentUser) {
    const design = await this.findOne(id, currentUser);
    // Seul un admin peut supprimer un design bloqué (réclamation IP)
    if (design.isBlocked && currentUser.role !== UserRole.PLATFORM_ADMIN) {
      throw new ForbiddenException(
        'This design is blocked due to an IP claim. Only platform admins can delete it.',
      );
    }

    await this.prisma.design.delete({
      where: { id },
    });

    return { success: true, message: 'Design deleted successfully' };
  }

  /**
   * Exporte un design pour l'impression (PDF, PNG, JPG, SVG haute résolution)
   */
  async exportForPrint(
    designId: string,
    options: {
      format: 'pdf' | 'png' | 'jpg' | 'svg';
      quality?: 'low' | 'medium' | 'high' | 'ultra';
      dimensions?: { width: number; height: number };
      imageUrl?: string;
      designData?: Record<string, unknown>;
    },
    currentUser: CurrentUser,
  ): Promise<{ fileUrl: string; fileSize: number }> {
    // Vérifier les permissions
    const design = await this.findOne(designId, currentUser);

    const format = options.format || 'pdf';
    const quality = options.quality || 'high';
    const dimensions = options.dimensions || {
      width: design.canvasWidth ?? 1920,
      height: design.canvasHeight ?? 1080,
    };

    // Récupérer l'URL de l'image ou générer depuis designData
    const imageUrl = options.imageUrl || design.imageUrl || design.highResUrl || design.previewUrl;

    if (!imageUrl && !options.designData) {
      throw new BadRequestException('Design has no image URL or design data to export');
    }

    try {
      let fileUrl: string;
      let fileSize: number;
      const timestamp = Date.now();

      // Télécharger l'image source si disponible
      let imageBuffer: Buffer | null = null;
      if (imageUrl) {
        try {
          const response = await firstValueFrom(
            this.httpService.get(imageUrl, { responseType: 'arraybuffer' }),
          );
          imageBuffer = Buffer.from(response.data);
        } catch (dlErr) {
          this.logger.warn(`Could not download source image: ${dlErr}`);
        }
      }

      if (format === 'pdf') {
        // Générer un PDF avec PDFKit
        const pdfBuffer = await this.generatePDF(design, imageBuffer, dimensions, quality);
        fileSize = pdfBuffer.length;

        // Upload vers storage
        const filename = `exports/${designId}_${timestamp}.pdf`;
        fileUrl = await this.storageService.uploadBuffer(
          pdfBuffer,
          filename,
          { contentType: 'application/pdf' },
        ) as string;

        this.logger.log(`PDF export completed: ${fileUrl}`);

      } else if (format === 'png' || format === 'jpg') {
        // Traiter l'image avec Sharp
        const qualityMap: Record<string, number> = { ultra: 100, high: 90, medium: 75, low: 60 };
        const sharpQuality = qualityMap[quality] || 90;

        let processedBuffer: Buffer;
        if (imageBuffer) {
          const sharpInstance = sharp(imageBuffer)
            .resize(dimensions.width, dimensions.height, { fit: 'contain', background: '#ffffff' });

          if (format === 'jpg') {
            processedBuffer = await sharpInstance.jpeg({ quality: sharpQuality, mozjpeg: true }).toBuffer();
          } else {
            processedBuffer = await sharpInstance.png({ compressionLevel: quality === 'ultra' ? 6 : 9 }).toBuffer();
          }
        } else {
          // Créer une image placeholder
          processedBuffer = await sharp({
            create: {
              width: dimensions.width,
              height: dimensions.height,
              channels: 4,
              background: { r: 245, g: 245, b: 245, alpha: 1 },
            },
          })
            .png()
            .toBuffer();
        }

        fileSize = processedBuffer.length;

        const filename = `exports/${designId}_${timestamp}.${format}`;
        fileUrl = await this.storageService.uploadBuffer(
          processedBuffer,
          filename,
          { contentType: `image/${format === 'jpg' ? 'jpeg' : 'png'}` },
        ) as string;

        this.logger.log(`Image export completed: ${fileUrl}`);

      } else if (format === 'svg') {
        // Générer un SVG depuis designData
        const svgContent = this.generateSVG(design, options.designData, dimensions);
        const svgBuffer = Buffer.from(svgContent, 'utf-8');
        fileSize = svgBuffer.length;

        const filename = `exports/${designId}_${timestamp}.svg`;
        fileUrl = await this.storageService.uploadBuffer(
          svgBuffer,
          filename,
          { contentType: 'image/svg+xml' },
        ) as string;

        this.logger.log(`SVG export completed: ${fileUrl}`);

      } else {
        throw new BadRequestException(`Unsupported export format: ${format}`);
      }

      this.logger.log(`Design exported for print`, {
        designId,
        format,
        quality,
        dimensions,
        fileUrl,
        fileSize,
      });

      return {
        fileUrl,
        fileSize,
      };
    } catch (error) {
      this.logger.error('Error exporting design for print', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to export design');
    }
  }

  /**
   * Génère un PDF avec PDFKit
   */
  private async generatePDF(
    design: { id: string; name: string | null; description?: string | null },
    imageBuffer: Buffer | null,
    dimensions: { width: number; height: number },
    quality: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Créer un document PDF avec les dimensions appropriées
        const doc = new PDFDocument({
          size: [dimensions.width, dimensions.height],
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          info: {
            Title: design.name || 'Luneo Design Export',
            Author: 'Luneo Platform',
            Subject: design.description || 'Design Export',
            Creator: 'Luneo Print Export',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Ajouter l'image si disponible
        if (imageBuffer) {
          doc.image(imageBuffer, 0, 0, {
            width: dimensions.width,
            height: dimensions.height,
            fit: [dimensions.width, dimensions.height],
            align: 'center',
            valign: 'center',
          });
        } else {
          // Créer un placeholder avec le nom du design
          doc.rect(0, 0, dimensions.width, dimensions.height).fill('#f5f5f5');
          (doc as { fillColor: (c: string) => { fontSize: (n: number) => { text: (s: string, x?: number, y?: number, opts?: Record<string, unknown>) => void } } }).fillColor('#333333')
            .fontSize(24)
            .text(design.name || 'Design', 0, dimensions.height / 2 - 12, {
              width: dimensions.width,
              align: 'center',
            });
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Génère un SVG depuis les données du design
   */
  private generateSVG(
    design: { id: string; name: string | null },
    designData: Record<string, unknown> | undefined,
    dimensions: { width: number; height: number },
  ): string {
    // Si designData contient déjà du SVG, l'utiliser
    if (designData?.svg && typeof designData.svg === 'string') {
      return designData.svg;
    }

    // Sinon, créer un SVG de base
    const elements: string[] = [];

    // Parcourir les éléments du design si disponibles
    if (designData?.elements && Array.isArray(designData.elements)) {
      for (const element of designData.elements) {
        const el = element as Record<string, unknown>;
        if (el.type === 'rect') {
          elements.push(
            `<rect x="${el.x || 0}" y="${el.y || 0}" width="${el.width || 100}" height="${el.height || 100}" fill="${el.fill || '#cccccc'}" />`
          );
        } else if (el.type === 'circle') {
          elements.push(
            `<circle cx="${el.cx || 50}" cy="${el.cy || 50}" r="${el.r || 50}" fill="${el.fill || '#cccccc'}" />`
          );
        } else if (el.type === 'text') {
          elements.push(
            `<text x="${el.x || 0}" y="${el.y || 50}" font-size="${el.fontSize || 16}" fill="${el.fill || '#000000'}">${el.content || ''}</text>`
          );
        } else if (el.type === 'image' && el.href) {
          elements.push(
            `<image x="${el.x || 0}" y="${el.y || 0}" width="${el.width || 100}" height="${el.height || 100}" href="${el.href}" />`
          );
        } else if (el.type === 'path' && el.d) {
          elements.push(
            `<path d="${el.d}" fill="${el.fill || 'none'}" stroke="${el.stroke || '#000000'}" stroke-width="${el.strokeWidth || 1}" />`
          );
        }
      }
    }

    // Si pas d'éléments, créer un placeholder
    if (elements.length === 0) {
      elements.push(`<rect width="100%" height="100%" fill="#f5f5f5" />`);
      elements.push(`<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="24" fill="#333333">${design.name || 'Design'}</text>`);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${dimensions.width}" height="${dimensions.height}" 
     viewBox="0 0 ${dimensions.width} ${dimensions.height}">
  <title>${design.name || 'Luneo Design'}</title>
  ${elements.join('\n  ')}
</svg>`;
  }

  /**
   * Duplique un design existant
   */
  async duplicate(designId: string, currentUser: CurrentUser) {
    // CRITICAL: Enforce design limit before creating a duplicate (counts as a new design)
    await this.plansService.enforceDesignLimit(currentUser.id);

    const originalDesign = await this.findOne(designId, currentUser);
    this.assertDesignNotBlocked(originalDesign);

    // Récupérer le design complet avec tous les champs
    const fullDesign = await this.prisma.design.findUnique({
      where: { id: designId },
      select: {
        name: true,
        description: true,
        prompt: true,
        options: true,
        productId: true,
        brandId: true,
        previewUrl: true,
        highResUrl: true,
        imageUrl: true,
        renderUrl: true,
        metadata: true,
        designData: true,
        canvasWidth: true,
        canvasHeight: true,
        canvasBackgroundColor: true,
        status: true,
      },
    });

    if (!fullDesign) {
      throw new NotFoundException('Design not found');
    }

    // Créer un nouveau design avec les mêmes données
    const duplicatedDesign = await this.prisma.design.create({
      data: {
        name: `${fullDesign.name || 'Design'} (Copy)`,
        description: fullDesign.description,
        prompt: fullDesign.prompt,
        options: fullDesign.options as Prisma.InputJsonValue,
        productId: fullDesign.productId,
        brandId: fullDesign.brandId,
        userId: currentUser.id,
        previewUrl: fullDesign.previewUrl,
        highResUrl: fullDesign.highResUrl,
        imageUrl: fullDesign.imageUrl,
        renderUrl: fullDesign.renderUrl,
        metadata: fullDesign.metadata as Prisma.InputJsonValue,
        designData: fullDesign.designData as Prisma.InputJsonValue,
        canvasWidth: fullDesign.canvasWidth,
        canvasHeight: fullDesign.canvasHeight,
        canvasBackgroundColor: fullDesign.canvasBackgroundColor,
        status: DesignStatus.PENDING, // Nouveau design, statut initial
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        previewUrl: true,
        imageUrl: true,
        userId: true,
        brandId: true,
        productId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Design duplicated: ${designId} -> ${duplicatedDesign.id}`);

    return duplicatedDesign;
  }

  /**
   * Génère un token de partage pour un design
   */
  async share(designId: string, options: { expiresInDays?: number } = {}, currentUser: CurrentUser) {
    const design = await this.findOne(designId, currentUser);
    this.assertDesignNotBlocked(design);

    // Générer un token unique
    const shareToken = crypto.randomBytes(32).toString('hex');

    // Calculer la date d'expiration (par défaut 30 jours)
    const expiresInDays = options.expiresInDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Mettre à jour le design avec le token de partage
    // Note: Si le modèle Design n'a pas de champ shareToken, on peut utiliser metadata
    const updatedDesign = await this.prisma.design.update({
      where: { id: designId },
      data: {
        metadata: {
          ...((design.metadata as Record<string, unknown>) || {}),
          shareToken,
          shareTokenExpiresAt: expiresAt.toISOString(),
          sharedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
        metadata: true,
      },
    });

    const appUrl = this.configService.get<string>('app.frontendUrl')
      ?? this.configService.get<string>('FRONTEND_URL')
      ?? this.configService.get<string>('APP_URL')
      ?? 'http://localhost:3000';
    const shareUrl = `${appUrl}/designs/shared/${shareToken}`;

    this.logger.log(`Design shared: ${designId} with token ${shareToken}`);

    return {
      shareToken,
      shareUrl,
      expiresAt: expiresAt.toISOString(),
      design: {
        id: updatedDesign.id,
        name: updatedDesign.name,
      },
    };
  }

  /**
   * Récupère un design partagé via son token
   */
  async getShared(shareToken: string) {
    // Rechercher tous les designs et filtrer par token dans metadata
    // Note: Prisma ne supporte pas bien les requêtes JSON profondes, on récupère tous les designs
    // et on filtre en mémoire (pour production, utiliser une colonne dédiée shareToken)
    const allDesigns = await this.prisma.design.findMany({
      where: {
        metadata: {
          not: Prisma.JsonNull,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        previewUrl: true,
        highResUrl: true,
        imageUrl: true,
        metadata: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    // Filtrer en mémoire pour trouver le design avec le bon token
    const design = allDesigns.find((d) => {
      const metadata = d.metadata as Record<string, unknown> | null;
      return metadata?.shareToken === shareToken;
    });

    if (!design) {
      throw new NotFoundException('Shared design not found');
    }
    const metadata = design.metadata as Record<string, unknown> | null;

    // Vérifier l'expiration
    if (metadata?.shareTokenExpiresAt) {
      const expiresAt = new Date(metadata.shareTokenExpiresAt as string | number | Date);
      if (expiresAt < new Date()) {
        throw new BadRequestException('Shared design link has expired');
      }
    }

    const d = design as typeof design & { product: { id: string; name: string | null; price: number | null; description: string | null } | null; brand: { id: string; name: string; logo: string | null } | null };
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      previewUrl: d.previewUrl,
      highResUrl: d.highResUrl,
      imageUrl: d.imageUrl,
      product: d.product,
      brand: d.brand,
      createdAt: d.createdAt,
      isShared: true,
    };
  }

  /**
   * Get share status for a design (for owner): existing share token and expiry.
   */
  async getShareStatus(designId: string, currentUser: CurrentUser) {
    const design = await this.findOne(designId, currentUser);
    const meta = (design.metadata as Record<string, unknown>) || {};
    const shareToken = meta.shareToken as string | undefined;
    const expiresAt = meta.shareTokenExpiresAt as string | undefined;
    const appUrl = this.configService.get<string>('app.frontendUrl')
      ?? this.configService.get<string>('FRONTEND_URL')
      ?? this.configService.get<string>('APP_URL')
      ?? this.configService.get<string>('NEXT_PUBLIC_APP_URL')
      ?? 'http://localhost:3000';
    const shares = shareToken
      ? [
          {
            token: shareToken,
            shareUrl: `${appUrl}/share/${shareToken}`,
            expires_at: expiresAt ?? null,
            isExpired: expiresAt ? new Date(expiresAt) < new Date() : false,
            created_at: (meta.sharedAt as string) ?? null,
          },
        ]
      : [];
    return { shares };
  }

  /**
   * Record an action on a shared design (download, ar_launch, share). Used for analytics.
   */
  async recordShareAction(token: string, actionType: string) {
    const validActions = ['download', 'ar_launch', 'share'];
    if (!validActions.includes(actionType)) {
      throw new BadRequestException(`Invalid action_type. Allowed: ${validActions.join(', ')}`);
    }
    this.logger.log(`Share action recorded: token=${token.slice(0, 8)}... action=${actionType}`);
    return { message: 'Action enregistrée avec succès' };
  }
}
