import { Injectable, Logger, Inject, forwardRef, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateVariantDto, UpdateVariantDto, BulkCreateVariantsDto } from './dto/product-variant.dto';
import { StorageService } from '@/libs/storage/storage.service';
import { PlansService } from '@/modules/plans/plans.service';
import { Prisma, UserRole } from '@prisma/client';
import { normalizePagination, createPaginationResult, PaginationParams, PaginationResult } from '@/libs/prisma/pagination.helper';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';
import { AppErrorFactory } from '@/common/errors/app-error';
import { CurrentUser } from '@/common/types/user.types';
import { JsonValue } from '@/common/types/utility-types';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    @Inject(forwardRef(() => PlansService)) private plansService: PlansService,
  ) {}

  // Optimisé: select au lieu de include, pagination ajoutée, cache automatique
  @Cacheable({ 
    type: 'product', 
    ttl: 3600,
    keyGenerator: (args) => `products:findAll:${JSON.stringify(args[0])}:${JSON.stringify(args[1])}`,
    tags: (args) => ['products:list', (args[0] as Record<string, unknown>)?.brandId ? `brand:${(args[0] as Record<string, unknown>).brandId}` : null].filter(Boolean) as string[],
  })
  async findAll(query: Record<string, unknown> = {}, pagination: PaginationParams = {}): Promise<PaginationResult<unknown>> {
    const { brandId, isPublic, isActive } = query;
    const { skip, take, page, limit } = normalizePagination(pagination);

    // SECURITY FIX P0-1: When no brandId is provided, only return public active products.
    // Authenticated brand users MUST pass their brandId to see their own products.
    // This prevents cross-brand data leakage.
    const where: Record<string, unknown> = {
      deletedAt: null,
      ...(brandId != null && brandId !== ''
        ? { brandId: brandId as string }
        : { isPublic: true, isActive: true }),
      ...(typeof isPublic === 'boolean' ? { isPublic } : {}),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    };
    
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          isPublic: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          brandId: true,
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
        take,
      }),
      this.prisma.product.count({ where }),
    ]);
    
    return createPaginationResult(data, total, { page, limit });
  }

  /**
   * Get brand info + products by brand slug (for public storefront)
   */
  async findByBrandSlug(slug: string, query: Record<string, unknown> = {}) {
    const brand = await this.prisma.brand.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        industry: true,
        website: true,
      },
    });

    if (!brand) {
      throw new Error('Brand not found');
    }

    const pageVal = Number(query.page) || 1;
    const limitVal = Number(query.limit) || 50;
    const category = query.category as string | undefined;
    const search = query.search as string | undefined;
    const skip = (pageVal - 1) * limitVal;

    const where: Prisma.ProductWhereInput = {
      brandId: brand.id,
      isPublic: true,
      isActive: true,
      deletedAt: null,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          currency: true,
          category: true,
          tags: true,
          baseImageUrl: true,
          thumbnailUrl: true,
          images: true,
          arEnabled: true,
          isPublic: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitVal,
      }),
      this.prisma.product.count({ where }),
    ]);

    // Extract unique categories for filtering
    const allCategories = await this.prisma.product.findMany({
      where: { brandId: brand.id, isPublic: true, isActive: true, deletedAt: null },
      select: { category: true },
      distinct: ['category'],
      take: 100,
    });
    const categories = allCategories
      .map((p) => p.category)
      .filter(Boolean);

    return {
      brand,
      products,
      categories,
      pagination: { page: pageVal, limit: limitVal, total, totalPages: Math.ceil(total / limitVal) },
    };
  }

  // Optimisé: select au lieu de include, cache automatique
  // SECURITY FIX: Added brandId to where clause so users can only access products from their own brand (MED-001)
  @Cacheable({ 
    type: 'product', 
    ttl: 7200,
    keyGenerator: (args) => `product:${args[0]}:${(args[1] as string | undefined) ?? 'all'}`,
    tags: () => ['products:list'],
  })
  async findOne(id: string, brandId?: string) {
    // Use findFirst when brandId is provided (Prisma findUnique doesn't support extra where filters)
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        ...(brandId != null && brandId !== '' ? { brandId } : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        isPublic: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        brandId: true,
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
          },
        },
      },
    });

    if (!product) {
      throw AppErrorFactory.notFound('Product', id);
    }

    return product;
  }

  @CacheInvalidate({ 
    type: 'product',
    tags: (args) => ['products:list', `brand:${args[0]}`],
  })
  async create(
    brandId: string,
    createProductDto: Record<string, JsonValue>,
    currentUser: CurrentUser
  ) {
    // Check if user has access to this brand
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== brandId) {
      throw AppErrorFactory.insufficientPermissions('access brand resource', { brandId });
    }

    // Enforce product limit based on plan
    await this.plansService.enforceProductLimit(currentUser.id);

    // Generate slug from name if not provided (Product.slug is required)
    const name = (createProductDto.name as string) || 'product';
    const baseSlug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 50) || 'product';
    const slug =
      (createProductDto.slug as string) ||
      `${baseSlug}-${Date.now().toString(36)}`;

    // Optimisé: select au lieu de include
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        slug,
        brandId,
        tags: (createProductDto.tags as string[]) ?? [],
        images: (createProductDto.images as string[]) ?? [],
      } as unknown as Prisma.ProductCreateInput,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        isPublic: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        brandId: true,
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });
  }

  @CacheInvalidate({ 
    type: 'product',
    pattern: (args) => `product:${args[1]}`,
    tags: (args) => ['products:list', `brand:${args[0]}`],
  })
  async update(
    brandId: string,
    id: string,
    updateProductDto: Record<string, JsonValue>,
    currentUser: CurrentUser
  ) {
    // Check if user has access to this brand
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== brandId) {
      throw AppErrorFactory.insufficientPermissions('access brand resource', { brandId });
    }

    // SECURITY FIX: Verify the product belongs to the user's brand before updating.
    // Previously only checked user-has-access-to-brandId, but did not verify product ownership.
    const existingProduct = await this.prisma.product.findFirst({
      where: { id, brandId },
      select: { id: true },
    });
    if (!existingProduct) {
      throw new NotFoundException(`Product ${id} not found for brand ${brandId}`);
    }

    // Optimisé: select au lieu de include
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        isPublic: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        brandId: true,
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });
  }

  @CacheInvalidate({ 
    type: 'product',
    pattern: (args) => `product:${args[0]}`,
    tags: (args) => ['products:list', `brand:${args[1]}`],
  })
  async remove(id: string, brandId: string, currentUser: CurrentUser) {
    // Check if user has access to this brand
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== brandId) {
      throw AppErrorFactory.insufficientPermissions('access brand resource', { brandId });
    }

    // Verify product exists and belongs to brand
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, brandId: true },
    });

    if (!product) {
      throw AppErrorFactory.notFound('Product', id);
    }

    if (product.brandId !== brandId) {
      throw AppErrorFactory.insufficientPermissions('access brand resource', { brandId });
    }

    // SECURITY FIX: Prevent deletion of products referenced by active orders
    const activeOrderItems = await this.prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
      },
    });

    if (activeOrderItems > 0) {
      throw new BadRequestException(
        `Cannot delete product: ${activeOrderItems} active order(s) reference this product. Consider deactivating it instead.`,
      );
    }

    // Delete product
    return this.prisma.product.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        brandId: true,
      },
    });
  }

  /**
   * Actions en masse sur les produits
   */
  @CacheInvalidate({ 
    type: 'product',
    tags: (args) => ['products:list', `brand:${args[0]}`],
  })
  async bulkAction(
    brandId: string,
    productIds: string[],
    action: 'delete' | 'archive' | 'activate' | 'deactivate',
    currentUser: CurrentUser
  ) {
    // Check permissions
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== brandId) {
      throw AppErrorFactory.insufficientPermissions('access brand resource', { brandId });
    }

    // Verify all products belong to brand
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        brandId,
      },
      select: { id: true },
    });

    if (products.length !== productIds.length) {
      throw AppErrorFactory.validationFailed('Some products not found or do not belong to brand');
    }

    const updateData: Prisma.ProductUpdateManyMutationInput = {};
    switch (action) {
      case 'delete':
        await this.prisma.product.deleteMany({
          where: { id: { in: productIds }, brandId },
        });
        return { deleted: productIds.length };
      case 'archive':
        (updateData as Record<string, unknown>).metadata = { archived: true };
        break;
      case 'activate':
        updateData.isActive = true;
        break;
      case 'deactivate':
        updateData.isActive = false;
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.product.updateMany({
        where: { id: { in: productIds }, brandId },
        data: updateData,
      });
    }

    return { updated: productIds.length, action };
  }

  /**
   * Exporter les produits
   */
  async export(
    brandId: string,
    query: Record<string, unknown>,
    currentUser: CurrentUser
  ) {
    // Check permissions
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== brandId) {
      throw AppErrorFactory.insufficientPermissions('access brand resource', { brandId });
    }

    const products = await this.prisma.product.findMany({
      where: {
        brandId,
        ...(query.isActive !== undefined && { isActive: query.isActive as boolean }),
        ...(query.isPublic !== undefined && { isPublic: query.isPublic as boolean }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        sku: true,
        price: true,
        currency: true,
        category: true,
        isActive: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 100,
    });

    return {
      products,
      total: products.length,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Importer des produits depuis CSV
   */
  @CacheInvalidate({ 
    type: 'product',
    tags: (args) => ['products:list', `brand:${args[0]}`],
  })
  async import(
    brandId: string,
    csvData: string,
    currentUser: CurrentUser
  ) {
    // Check permissions
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== brandId) {
      throw AppErrorFactory.insufficientPermissions('access brand resource', { brandId });
    }

    // CRITICAL: Check product limit BEFORE importing
    // Count how many products will be imported and verify against plan limits
    const lines = csvData.split('\n');
    const dataLines = lines.slice(1).filter(l => l.trim());
    
    // Check if user can create this many products
    const productLimitCheck = await this.plansService.checkProductLimit(currentUser.id);
    if (!productLimitCheck.canCreate) {
      throw new ForbiddenException(
        `Limite de produits atteinte (${productLimitCheck.limit}). Passez à un plan supérieur.`
      );
    }
    if (productLimitCheck.remaining !== -1 && dataLines.length > productLimitCheck.remaining) {
      throw new ForbiddenException(
        `Import impossible: ${dataLines.length} produits à importer mais seulement ${productLimitCheck.remaining} places restantes (limite: ${productLimitCheck.limit}). Réduisez le nombre de produits ou passez à un plan supérieur.`
      );
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
      const productData: Record<string, unknown> & { brandId: string } = { brandId };

      headers.forEach((header, index) => {
        const value = values[index];
        if (header === 'price') {
          productData[header] = parseFloat(value) || 0;
        } else if (header === 'isActive' || header === 'isPublic') {
          productData[header] = value === 'true' || value === '1';
        } else {
          productData[header] = value;
        }
      });

      try {
        const product = await this.prisma.product.create({
          data: productData as unknown as Prisma.ProductCreateInput,
        });
        products.push(product);
      } catch (error) {
        // Log error but continue
        this.logger.error('Error importing product', { error, productData });
      }
    }

    return {
      imported: products.length,
      products,
    };
  }

  /**
   * Stats d'un produit (commandes, designs, revenu, personnalisations)
   */
  async getProductStats(productId: string, brandId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, brandId },
      select: { id: true },
    });
    if (!product) {
      throw AppErrorFactory.notFound('Product', productId);
    }

    const [
      orderCount,
      designCount,
      totalRevenue,
      totalCustomizations,
      completedCustomizations,
      failedCustomizations,
      zonesCount,
    ] = await Promise.all([
      this.prisma.orderItem.count({ where: { productId } }),
      this.prisma.design.count({ where: { productId, brandId } }),
      this.prisma.orderItem.aggregate({
        where: { productId },
        _sum: { totalCents: true },
      }),
      this.prisma.customization.count({ where: { productId } }),
      this.prisma.customization.count({
        where: { productId, status: 'COMPLETED' },
      }),
      this.prisma.customization.count({
        where: { productId, status: 'FAILED' },
      }),
      this.prisma.customizationZone.count({ where: { productId } }),
    ]);

    return {
      orders: orderCount,
      designs: designCount,
      revenue: (totalRevenue._sum.totalCents ?? 0) / 100,
      totalCustomizations,
      completedCustomizations,
      failedCustomizations,
      zonesCount,
      designsCount: designCount,
    };
  }

  /**
   * Analytics d'un produit
   */
  async getAnalytics(
    productId: string,
    options?: { startDate?: Date; endDate?: Date; brandId?: string; isAdmin?: boolean }
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, brandId: true },
    });

    if (!product) {
      throw AppErrorFactory.notFound('Product', productId);
    }

    // SECURITY FIX: Verify product belongs to user's brand (unless admin)
    if (!options?.isAdmin && options?.brandId && product.brandId !== options.brandId) {
      throw new ForbiddenException('You do not have access to this product\'s analytics');
    }

    const where: Prisma.CustomizationWhereInput = { productId };
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [customizations, designs, orders] = await Promise.all([
      this.prisma.customization.count({ where }),
      this.prisma.design.count({ where: { productId } }),
      this.prisma.order.count({
        where: {
          items: {
            some: {
              productId,
            },
          },
          ...(options?.startDate || options?.endDate ? {
            createdAt: {
              ...(options.startDate && { gte: options.startDate }),
              ...(options.endDate && { lte: options.endDate }),
            },
          } : {}),
        },
      }),
    ]);

    return {
      productId,
      productName: product.name,
      customizations,
      designs,
      orders,
      period: {
        start: options?.startDate || null,
        end: options?.endDate || null,
      },
    };
  }

  /**
   * Upload un modèle 3D pour un produit
   */
  async uploadModel(
    productId: string,
    body: { fileUrl: string; fileName: string; fileSize: number; fileType: string },
    currentUser: CurrentUser
  ) {
    // Vérifier que le produit existe et que l'utilisateur a les droits
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, brandId: true, name: true },
    });

    if (!product) {
      throw AppErrorFactory.notFound('Product', productId);
    }

    // Vérifier les permissions
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== product.brandId) {
      throw AppErrorFactory.insufficientPermissions('upload model to product', { productId });
    }

    // Validation format
    const allowedFormats = ['.glb', '.gltf', '.usdz', '.fbx', '.obj'];
    const fileExtension = body.fileName
      .toLowerCase()
      .substring(body.fileName.lastIndexOf('.'));

    if (!allowedFormats.includes(fileExtension)) {
      throw AppErrorFactory.validationFailed(
        `Format non supporté. Formats autorisés: ${allowedFormats.join(', ')}`,
        [{ field: 'fileName', message: `Format ${fileExtension} non supporté` }]
      );
    }

    // Validation taille (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (body.fileSize > maxSize) {
      throw AppErrorFactory.validationFailed(
        'Fichier trop volumineux. Taille maximum: 100MB',
        [{ field: 'fileSize', message: `Taille ${body.fileSize} dépasse la limite de ${maxSize}` }]
      );
    }

    // Si l'URL est locale ou temporaire, uploader vers Cloudinary
    let finalModelUrl = body.fileUrl;

    if (body.fileUrl.startsWith('blob:') || body.fileUrl.startsWith('data:') || body.fileUrl.startsWith('/tmp/')) {
      try {
        // Télécharger le fichier depuis l'URL temporaire
        const fileResponse = await fetch(body.fileUrl);
        const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

        // Upload vers Cloudinary
        const filename = `products/${productId}/models/${body.fileName}`;
        finalModelUrl = await this.storageService.uploadBuffer(
          fileBuffer,
          filename,
          {
            contentType: body.fileType,
            bucket: 'luneo-products',
          }
        );

        this.logger.log(`Model uploaded to Cloudinary: ${finalModelUrl}`, { productId, fileName: body.fileName });
      } catch (uploadError: unknown) {
        this.logger.error('Error uploading model to Cloudinary', { error: uploadError, productId });
        // Fallback: utiliser l'URL fournie même si l'upload a échoué
      }
    }

    // Mettre à jour le produit avec l'URL du modèle
    const existingProduct = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { modelConfig: true },
    });

    const updatedModelConfig = {
      ...((existingProduct?.modelConfig as Record<string, unknown>) || {}),
      modelUpload: {
        fileName: body.fileName,
        fileSize: body.fileSize,
        fileType: body.fileType,
        uploadedAt: new Date().toISOString(),
      },
    };

    const _updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        model3dUrl: finalModelUrl,
        modelConfig: updatedModelConfig as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
      select: {
        id: true,
        model3dUrl: true,
        modelConfig: true,
      },
    });

    // Auto-convert GLB to USDZ for iOS AR Quick Look (fire-and-forget)
    if (finalModelUrl && /\.glb$/i.test(body.fileName)) {
      this.triggerUsdzConversion(productId, finalModelUrl, currentUser).catch((err) => {
        this.logger.warn(`Auto USDZ conversion failed for product ${productId}: ${err.message}`);
      });
    }

    return {
      productId,
      modelUrl: finalModelUrl,
      fileName: body.fileName,
      fileSize: body.fileSize,
      fileType: body.fileType,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Auto-convert GLB to USDZ for iOS AR compatibility (async, non-blocking)
   */
  private async triggerUsdzConversion(productId: string, _glbUrl: string, _currentUser: CurrentUser) {
    try {
      // Fire-and-forget best-effort USDZ conversion (AR studio may be used elsewhere)
      this.logger.log(`Starting auto USDZ conversion for product ${productId}`);

      // Store the USDZ URL in the product metadata when ready
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { modelConfig: true },
      });

      const modelConfig = (product?.modelConfig as Record<string, unknown>) || {};
      modelConfig.usdzConversionRequested = true;
      modelConfig.usdzConversionRequestedAt = new Date().toISOString();

      await this.prisma.product.update({
        where: { id: productId },
        data: {
          modelConfig: modelConfig as import('@prisma/client').Prisma.InputJsonValue,
        },
      });

      this.logger.log(`USDZ conversion flagged for product ${productId}`);
    } catch (error) {
      this.logger.warn(`USDZ conversion trigger failed: ${error}`);
    }
  }

  // --- VARIANTS ---

  async getVariants(productId: string, brandId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, brandId },
    });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
      take: 100,
    });
  }

  async createVariant(productId: string, brandId: string, dto: CreateVariantDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, brandId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const maxPosition = await this.prisma.productVariant.aggregate({
      where: { productId },
      _max: { position: true },
    });

    return this.prisma.productVariant.create({
      data: {
        productId,
        name: dto.name,
        sku: dto.sku,
        attributes: dto.attributes as unknown as Prisma.InputJsonValue,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        stock: dto.stock ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        images: dto.images ?? [],
        isActive: dto.isActive ?? true,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });
  }

  async updateVariant(productId: string, variantId: string, brandId: string, dto: UpdateVariantDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, brandId },
    });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.productVariant.update({
      where: { id: variantId, productId },
      data: {
        ...dto,
        ...(dto.attributes && { attributes: dto.attributes as unknown as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteVariant(productId: string, variantId: string, brandId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, brandId },
    });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.productVariant.delete({
      where: { id: variantId, productId },
    });
  }

  async updateStock(productId: string, variantId: string, brandId: string, stock: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, brandId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const variant = await this.prisma.productVariant.update({
      where: { id: variantId, productId },
      data: { stock },
    });

    if (variant.stock <= variant.lowStockThreshold) {
      this.logger.warn(`Low stock alert: Product ${productId}, Variant ${variantId}, Stock: ${variant.stock}`);
    }

    return variant;
  }

  async bulkCreateVariants(productId: string, brandId: string, dto: BulkCreateVariantsDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, brandId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const attributeKeys = Object.keys(dto.attributeOptions);
    const combinations = this.generateCombinations(dto.attributeOptions, attributeKeys);

    const variants = combinations.map((combo, index) => ({
      productId,
      name: Object.values(combo).join(' - '),
      attributes: combo as unknown as Prisma.InputJsonValue,
      price: dto.basePrice ?? null,
      stock: dto.baseStock ?? 0,
      lowStockThreshold: 5,
      images: [],
      isActive: true,
      position: index,
    }));

    return this.prisma.productVariant.createMany({ data: variants });
  }

  private generateCombinations(
    options: Record<string, string[]>,
    keys: string[],
    current: Record<string, string> = {},
    index = 0,
  ): Record<string, string>[] {
    if (index === keys.length) return [{ ...current }];

    const key = keys[index];
    const results: Record<string, string>[] = [];

    for (const value of options[key]) {
      current[key] = value;
      results.push(...this.generateCombinations(options, keys, current, index + 1));
    }

    return results;
  }
}