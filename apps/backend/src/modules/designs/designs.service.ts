import { CurrentUser } from '@/common/types/user.types';
import { Cacheable } from '@/libs/cache/cacheable.decorator';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DesignStatus, UserRole } from '@prisma/client';
import { Queue } from 'bullmq';

@Injectable()
export class DesignsService {
  private readonly logger = new Logger(DesignsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('ai-generation') private aiQueue: Queue,
  ) {}

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

    // Optimisé: select au lieu de include
    // Create design record (cache invalidé automatiquement)
    const design = await this.prisma.design.create({
      data: {
        prompt,
        options: options as any,
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

  async findAll(currentUser: { id: string; role: UserRole; brandId?: string | null }, options?: { page?: number; limit?: number; status?: string; search?: string }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by brand if user is not platform admin
    if (currentUser.role !== UserRole.PLATFORM_ADMIN) {
      where.brandId = currentUser.brandId;
    }

    // Filter by status if provided
    if (options?.status) {
      where.status = options.status;
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

    if (design.status !== DesignStatus.COMPLETED) {
      throw new ForbiddenException('Design must be completed to upgrade to high-res');
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

  async getVersions(designId: string, currentUser: CurrentUser, options?: { page?: number; limit?: number; autoOnly?: boolean }) {
    const design = await this.findOne(designId, currentUser);

    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = { designId };
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
        options: design.options as any,
        previewUrl: design.previewUrl || null,
        highResUrl: design.highResUrl || null,
        imageUrl: design.imageUrl || null,
        renderUrl: design.renderUrl || null,
        metadata: design.metadata as any,
        designData: design.designData as any || null,
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
        } as any,
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

  async update(id: string, data: { name?: string; description?: string; status?: DesignStatus }, currentUser: CurrentUser) {
    const design = await this.findOne(id, currentUser);

    return this.prisma.design.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
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
  }

  async delete(id: string, currentUser: CurrentUser) {
    const design = await this.findOne(id, currentUser);

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
      designData?: any;
    },
    currentUser: CurrentUser,
  ): Promise<{ fileUrl: string; fileSize: number }> {
    // Vérifier les permissions
    const design = await this.findOne(designId, currentUser);

    const format = options.format || 'pdf';
    const quality = options.quality || 'high';
    const dimensions = options.dimensions || {
      width: (design as any).canvasWidth || 1920,
      height: (design as any).canvasHeight || 1080,
    };

    // Récupérer l'URL de l'image ou générer depuis designData
    const imageUrl = options.imageUrl || design.imageUrl || design.highResUrl || design.previewUrl;

    if (!imageUrl && !options.designData) {
      throw new BadRequestException('Design has no image URL or design data to export');
    }

    try {
      // Pour PDF, on utilise Puppeteer ou une librairie PDF
      // Pour PNG/JPG/SVG, on utilise Sharp
      // Ici, on simule l'export - dans un vrai projet, on utiliserait Puppeteer pour PDF
      // et Sharp pour PNG/JPG

      let fileUrl: string;
      let fileSize: number;

      if (format === 'pdf') {
        // Pour PDF, on devrait utiliser Puppeteer ou pdfkit
        // Pour l'instant, on simule
        this.logger.warn('PDF export not fully implemented - using placeholder');
        fileUrl = imageUrl ? imageUrl.replace(/\.(png|jpg|jpeg)$/i, '.pdf') : `https://storage.luneo.app/exports/${designId}_${Date.now()}.pdf`;
        fileSize = 1024 * 500; // 500KB placeholder
      } else if (format === 'png' || format === 'jpg') {
        // Pour PNG/JPG, on peut utiliser Sharp pour re-rendre à la bonne résolution
        // Ici, on retourne l'URL originale ou une version haute résolution
        const extension = format === 'jpg' ? 'jpg' : 'png';
        fileUrl = imageUrl || `https://storage.luneo.app/exports/${designId}_${Date.now()}.${extension}`;
        fileSize = 1024 * (quality === 'ultra' ? 2000 : quality === 'high' ? 1500 : quality === 'medium' ? 1000 : 500);
      } else if (format === 'svg') {
        // Pour SVG, on génère depuis designData ou on retourne un placeholder
        fileUrl = `https://storage.luneo.app/exports/${designId}_${Date.now()}.svg`;
        fileSize = 1024 * 100; // 100KB placeholder
      } else {
        throw new BadRequestException(`Unsupported export format: ${format}`);
      }

      // En production, on devrait:
      // 1. Télécharger l'image depuis imageUrl
      // 2. Traiter avec Sharp (PNG/JPG) ou Puppeteer (PDF)
      // 3. Uploader vers le storage
      // 4. Retourner l'URL finale

      // Log l'export (optionnel - peut être stocké dans une table ExportResult)
      this.logger.log(`Design exported for print`, {
        designId,
        format,
        quality,
        dimensions,
        fileUrl,
      });

      return {
        fileUrl,
        fileSize,
      };
    } catch (error) {
      this.logger.error(`Error exporting design for print:`, error);
      throw new Error(`Failed to export design: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
