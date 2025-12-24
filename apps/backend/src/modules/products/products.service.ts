import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { normalizePagination, createPaginationResult, PaginationParams, PaginationResult } from '@/libs/prisma/pagination.helper';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';
import { AppErrorFactory, AuthorizationError, ErrorCode } from '@/common/errors/app-error';
import { CurrentUser, MinimalUser, toMinimalUser } from '@/common/types/user.types';
import { JsonValue } from '@/common/types/utility-types';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

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
        ...(createProductDto as any),
        brandId,
      } as any,
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
}
