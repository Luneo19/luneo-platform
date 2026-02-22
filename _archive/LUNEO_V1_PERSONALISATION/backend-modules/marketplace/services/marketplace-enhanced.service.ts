/**
 * Module 10 - Marketplace enhancements.
 * Advanced search with facets, creator dashboard, reviews, bundles.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { MarketplaceItemType, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface AdvancedSearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  creatorId?: string; // Brand ID (seller)
  type?: MarketplaceItemType;
  tags?: string[];
}

export interface AdvancedSearchResult {
  items: Array<{
    id: string;
    title: string;
    type: string;
    category: string | null;
    price: number;
    rating: number | null;
    reviewCount: number;
    sellerId: string;
    downloads: number;
  }>;
  total: number;
  facets: {
    categories: Array<{ value: string; count: number }>;
    priceRange: { min: number; max: number };
    ratings: Array<{ value: number; count: number }>;
  };
}

export interface CreatorDashboard {
  sales: number;
  revenue: number;
  views: number; // downloads as proxy
  popularItems: Array<{
    id: string;
    title: string;
    type: string;
    sales: number;
    revenue: number;
  }>;
}

export interface BundleResult {
  id: string;
  name: string;
  designIds: string[];
  discountPercent: number;
  createdAt: Date;
}

@Injectable()
export class MarketplaceEnhancedService {
  private readonly logger = new Logger(MarketplaceEnhancedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Advanced search with facets (category, price range, rating, creator).
   */
  async searchAdvanced(
    query: string,
    filters: AdvancedSearchFilters,
    options?: { page?: number; limit?: number },
  ): Promise<AdvancedSearchResult> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.MarketplaceItemWhereInput = { isActive: true };

    if (query?.trim()) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { description: { contains: query.trim(), mode: 'insensitive' } },
        { tags: { has: query.trim() } },
      ];
    }
    if (filters.category) where.category = filters.category;
    if (filters.creatorId) where.sellerId = filters.creatorId;
    if (filters.type) where.type = filters.type;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) (where.price as { gte?: Prisma.Decimal }).gte = new Decimal(filters.minPrice);
      if (filters.maxPrice !== undefined) (where.price as { lte?: Prisma.Decimal }).lte = new Decimal(filters.maxPrice);
    }
    if (filters.minRating !== undefined) {
      where.rating = { gte: new Decimal(filters.minRating) };
    }
    if (filters.tags?.length) {
      where.tags = { hasEvery: filters.tags };
    }

    const [items, total, allForFacets] = await Promise.all([
      this.prisma.marketplaceItem.findMany({
        where,
        orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          type: true,
          category: true,
          price: true,
          rating: true,
          reviewCount: true,
          sellerId: true,
          downloads: true,
        },
      }),
      this.prisma.marketplaceItem.count({ where }),
      this.prisma.marketplaceItem.findMany({
        where: { isActive: true },
        select: { category: true, price: true, rating: true },
      }),
    ]);

    const categories: Record<string, number> = {};
    let minP = Infinity;
    let maxP = 0;
    const ratings: Record<number, number> = {};
    for (const i of allForFacets) {
      if (i.category) categories[i.category] = (categories[i.category] ?? 0) + 1;
      const p = Number(i.price);
      if (p < minP) minP = p;
      if (p > maxP) maxP = p;
      const r = i.rating != null ? Math.round(Number(i.rating)) : 0;
      ratings[r] = (ratings[r] ?? 0) + 1;
    }

    return {
      items: items.map((i) => ({
        id: i.id,
        title: i.title,
        type: i.type,
        category: i.category,
        price: Number(i.price),
        rating: i.rating != null ? Number(i.rating) : null,
        reviewCount: i.reviewCount,
        sellerId: i.sellerId,
        downloads: i.downloads,
      })),
      total,
      facets: {
        categories: Object.entries(categories).map(([value, count]) => ({ value, count })),
        priceRange: { min: Number.isFinite(minP) ? minP : 0, max: maxP },
        ratings: Object.entries(ratings).map(([value, count]) => ({ value: Number(value), count })),
      },
    };
  }

  /**
   * Returns creator dashboard: sales, revenue, views (downloads), popular items.
   * userId is used to resolve to the user's brand(s); we use first brand as creator.
   */
  async getCreatorDashboard(userId: string): Promise<CreatorDashboard> {
    const membership = await this.prisma.teamMember.findFirst({
      where: { userId },
      select: { organizationId: true },
    });
    const brandId = membership?.organizationId ?? (await this.prisma.brand.findFirst({ select: { id: true } }))?.id;
    if (!brandId) {
      return { sales: 0, revenue: 0, views: 0, popularItems: [] };
    }

    const items = await this.prisma.marketplaceItem.findMany({
      where: { sellerId: brandId },
      include: {
        purchases: { where: { status: 'COMPLETED' }, select: { price: true } },
      },
    });

    let sales = 0;
    let revenue = 0;
    let views = 0;
    const itemStats: Array<{ id: string; title: string; type: string; sales: number; revenue: number }> = [];

    for (const item of items) {
      const itemSales = item.purchases.length;
      const itemRevenue = item.purchases.reduce((s, p) => s + Number(p.price), 0);
      sales += itemSales;
      revenue += itemRevenue;
      views += item.downloads;
      itemStats.push({
        id: item.id,
        title: item.title,
        type: item.type,
        sales: itemSales,
        revenue: itemRevenue,
      });
    }

    const popularItems = itemStats
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    return {
      sales,
      revenue,
      views,
      popularItems,
    };
  }

  /**
   * Submit a review for a marketplace item (design/item) with validation.
   */
  async submitReview(
    designId: string, // treated as marketplace itemId
    userId: string,
    rating: number,
    comment?: string,
  ): Promise<{ id: string }> {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const item = await this.prisma.marketplaceItem.findUnique({
      where: { id: designId, isActive: true },
    });
    if (!item) throw new NotFoundException('Marketplace item not found');

    const membership = await this.prisma.teamMember.findFirst({
      where: { userId },
      select: { organizationId: true },
    });
    const buyerId = membership?.organizationId ?? (await this.prisma.brand.findFirst({ select: { id: true } }))?.id;
    if (!buyerId) throw new BadRequestException('User has no associated brand for review');

    const existing = await this.prisma.marketplaceReview.findUnique({
      where: { itemId_buyerId: { itemId: designId, buyerId } },
    });
    if (existing) {
      const updated = await this.prisma.marketplaceReview.update({
        where: { itemId_buyerId: { itemId: designId, buyerId } },
        data: { rating, comment: comment ?? null },
      });
      await this.recomputeItemRating(designId);
      return { id: updated.id };
    }

    const review = await this.prisma.marketplaceReview.create({
      data: {
        itemId: designId,
        buyerId,
        rating,
        comment: comment ?? null,
      },
    });
    await this.recomputeItemRating(designId);
    this.logger.log(`Review submitted for item ${designId} by brand ${buyerId}`);
    return { id: review.id };
  }

  /**
   * Create a design bundle with name, design IDs, and discount percentage.
   * sellerId is the Brand ID of the bundle creator.
   */
  async createBundle(
    name: string,
    designIds: string[],
    discountPercent: number,
    sellerId?: string,
  ): Promise<BundleResult> {
    if (!name?.trim()) throw new BadRequestException('Bundle name is required');
    if (!designIds?.length) throw new BadRequestException('At least one design is required');
    if (discountPercent < 0 || discountPercent > 100) {
      throw new BadRequestException('Discount must be between 0 and 100');
    }
    const brandId = sellerId ?? (await this.prisma.brand.findFirst({ select: { id: true } }))?.id;
    if (!brandId) throw new BadRequestException('sellerId (Brand ID) is required to create a bundle');

    const bundleItem = await this.prisma.marketplaceItem.create({
      data: {
        sellerId: brandId,
        title: name,
        description: `Bundle of ${designIds.length} items (${discountPercent}% discount)`,
        type: 'TEMPLATE',
        category: 'bundle',
        tags: ['bundle'],
        price: new Decimal(0),
        previewImages: [],
        metadata: {
          bundle: true,
          designIds,
          discountPercent,
          createdAt: new Date().toISOString(),
        },
      },
    });

    this.logger.log(`Bundle created: ${bundleItem.id} with ${designIds.length} designs`);

    return {
      id: bundleItem.id,
      name: bundleItem.title,
      designIds,
      discountPercent,
      createdAt: bundleItem.createdAt,
    };
  }

  private async recomputeItemRating(itemId: string): Promise<void> {
    const agg = await this.prisma.marketplaceReview.aggregate({
      where: { itemId },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.marketplaceItem.update({
      where: { id: itemId },
      data: {
        rating: agg._avg.rating != null ? new Decimal(agg._avg.rating) : null,
        reviewCount: agg._count,
      },
    });
  }
}
