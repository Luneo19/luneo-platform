import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { Prisma, UserRole } from '@prisma/client';
import { normalizePagination, createPaginationResult, PaginationParams, PaginationResult } from '@/libs/prisma/pagination.helper';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';
import { AppErrorFactory, AuthorizationError, ErrorCode, ValidationError } from '@/common/errors/app-error';
import { CurrentUser, MinimalUser, toMinimalUser } from '@/common/types/user.types';
import { JsonValue } from '@/common/types/utility-types';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  // Optimisé: select au lieu de include, pagination ajoutée, cache automatique
  @Cacheable({ 
    type: 'product', 
    ttl: 3600,
    keyGenerator: (args) => `products:findAll:${JSON.stringify(args[0])}:${JSON.stringify(args[1])}`,
    tags: (args) => ['products:list', args[0]?.brandId ? `brand:${args[0].brandId}` : null].filter(Boolean) as string[],
  })
  async findAll(query: Record<string, unknown> = {}, pagination: PaginationParams = {}): Promise<PaginationResult<unknown>> {
    const { brandId, isPublic, isActive } = query;
    const { skip, take, page, limit } = normalizePagination(pagination);
    
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          ...(brandId && { brandId }),
          ...(isPublic !== undefined && { isPublic }),
          ...(isActive !== undefined && { isActive }),
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.product.count({
        where: {
          ...(brandId && { brandId }),
          ...(isPublic !== undefined && { isPublic }),
          ...(isActive !== undefined && { isActive }),
        },
      }),
    ]);
    
    return createPaginationResult(data, total, { page, limit });
  }

  // Optimisé: select au lieu de include, cache automatique
  @Cacheable({ 
    type: 'product', 
    ttl: 7200,
    keyGenerator: (args) => `product:${args[0]}`,
    tags: () => ['products:list'],
  })
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
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

    // Optimisé: select au lieu de include
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        brandId,
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

    const updateData: any = {};
    switch (action) {
      case 'delete':
        await this.prisma.product.deleteMany({
          where: { id: { in: productIds }, brandId },
        });
        return { deleted: productIds.length };
      case 'archive':
        updateData.metadata = { archived: true };
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

    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
      const productData: any = { brandId };

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
          data: productData,
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
   * Analytics d'un produit
   */
  async getAnalytics(
    productId: string,
    options?: { startDate?: Date; endDate?: Date }
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      throw AppErrorFactory.notFound('Product', productId);
    }

    const where: any = { productId };
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
      } catch (uploadError: any) {
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

    const updatedProduct = await this.prisma.product.update({
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

    return {
      productId,
      modelUrl: finalModelUrl,
      fileName: body.fileName,
      fileSize: body.fileSize,
      fileType: body.fileType,
      uploadedAt: new Date().toISOString(),
    };
  }
}