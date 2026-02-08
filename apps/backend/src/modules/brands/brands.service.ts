import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { Prisma, UserRole, BrandStatus } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';
import { JsonValue } from '@/common/types/utility-types';

@Injectable()
export class BrandsService {
  constructor(
    private prisma: PrismaOptimizedService,
    private cache: SmartCacheService
  ) {}

  async create(createBrandDto: Record<string, JsonValue>, userId: string) {
    const user = await this.cache.get(
      `user:${userId}`,
      'user',
      () => this.prisma.user.findUnique({
        where: { id: userId },
      })
    );

    if (!user || (user.role !== UserRole.BRAND_ADMIN && user.role !== UserRole.PLATFORM_ADMIN)) {
      throw new ForbiddenException('Only brand admins can create brands');
    }

    const brand = await this.prisma.brand.create({
      data: {
        ...createBrandDto,
        users: {
          connect: { id: userId },
        },
      } as unknown as Prisma.BrandCreateInput,
      include: {
        users: true,
      },
    });

    // Invalider le cache des brands après création
    await this.cache.invalidate('brands:list', 'brand');

    return brand;
  }

  async findOne(id: string, currentUser: CurrentUser) {
    // Vérifier les permissions d'abord (rapide)
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== id) {
      throw new ForbiddenException('Access denied to this brand');
    }

    // Utiliser le cache intelligent pour récupérer la brand
    const brand = await this.cache.get(
      `brand:${id}`,
      'brand',
      () => this.prisma.brand.findUnique({
        where: { id },
        include: {
          users: true,
          products: true,
        },
      }),
      { tags: [`brand:${id}`, 'brands:list'] }
    );

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return brand;
  }

  async update(id: string, updateBrandDto: Record<string, JsonValue>, currentUser: CurrentUser) {
    // Check permissions
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== id) {
      throw new ForbiddenException('Access denied to this brand');
    }

    const brand = await this.prisma.brand.update({
      where: { id },
      data: updateBrandDto,
      include: {
        users: true,
      },
    });

    // Invalider le cache après mise à jour
    await this.cache.invalidate(`brand:${id}`, 'brand');

    return brand;
  }

  async addWebhook(brandId: string, webhookData: Record<string, JsonValue>, currentUser: CurrentUser) {
    // Check permissions
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== brandId) {
      throw new ForbiddenException('Access denied to this brand');
    }

    const webhook = await this.prisma.webhook.create({
      data: {
        ...webhookData,
        brandId,
      } as unknown as Prisma.WebhookCreateInput,
    });

    // Invalider le cache des webhooks de la brand
    await this.cache.invalidate(`webhooks:${brandId}`, 'brand');

    return webhook;
  }

  /**
   * Récupérer toutes les brands avec cache
   */
  async findAll(page: number = 1, limit: number = 20, filters: Record<string, JsonValue> = {}) {
    const cacheKey = `brands:list:${page}:${limit}:${JSON.stringify(filters)}`;
    
    return this.cache.get(
      cacheKey,
      'brand',
      () => this.prisma.brand.findMany({
        where: filters,
        select: {
          id: true,
          name: true,
          logo: true,
          website: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          users: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          _count: {
            select: {
              products: true,
              designs: true,
              orders: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      { ttl: 1800, tags: ['brands:list'] }
    );
  }

  /**
   * Statistiques d'une brand avec cache
   */
  async getBrandStats(brandId: string, currentUser: CurrentUser) {
    // Check permissions
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== brandId) {
      throw new ForbiddenException('Access denied to this brand');
    }

    return this.cache.get(
      `brand:${brandId}:stats`,
      'analytics',
      () => this.prisma.getDashboardMetrics(brandId),
      { ttl: 300, tags: [`brand:${brandId}`] }
    );
  }

  /**
   * Recherche de brands avec cache
   */
  async searchBrands(query: string, limit: number = 10) {
    const cacheKey = `brands:search:${query}:${limit}`;
    
    return this.cache.get(
      cacheKey,
      'brand',
      () => this.prisma.brand.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { website: { contains: query, mode: 'insensitive' } }
          ],
          status: BrandStatus.ACTIVE
        },
        select: {
          id: true,
          name: true,
          description: true,
          logo: true,
          website: true,
          status: true
        },
        take: limit,
        orderBy: { name: 'asc' }
      }),
      { ttl: 600, tags: ['brands:search'] }
    );
  }
}
