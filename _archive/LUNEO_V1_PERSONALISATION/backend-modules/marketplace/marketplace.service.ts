import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CloudinaryService } from '@/libs/storage/cloudinary.service';
import { CreditsService } from '@/libs/credits/credits.service';
import { getMarketplaceCommission } from '@/libs/plans/plan-config';
import { MarketplaceItemType, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type { CreateMarketplaceItemDto } from './dto/create-marketplace-item.dto';
import type { UpdateMarketplaceItemDto } from './dto/update-marketplace-item.dto';

export interface ListMarketplaceItemsFilters {
  type?: string;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'popular' | 'price-asc' | 'price-desc' | 'rating';
  page?: number;
  limit?: number;
}

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private creditsService: CreditsService,
  ) {}

  async listItems(filters: ListMarketplaceItemsFilters) {
    const where: Record<string, unknown> = { isActive: true };
    if (filters.type) where.type = filters.type as MarketplaceItemType;
    if (filters.category) where.category = filters.category;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) (where.price as { gte?: number }).gte = filters.minPrice;
      if (filters.maxPrice !== undefined) (where.price as { lte?: number }).lte = filters.maxPrice;
    }

    const orderBy: Record<string, string> = {};
    switch (filters.sort) {
      case 'popular':
        orderBy.downloads = 'desc';
        break;
      case 'price-asc':
        orderBy.price = 'asc';
        break;
      case 'price-desc':
        orderBy.price = 'desc';
        break;
      case 'rating':
        orderBy.rating = 'desc';
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const [items, total] = await Promise.all([
      this.prisma.marketplaceItem.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, logo: true } },
          _count: { select: { reviews: true, purchases: true } },
        },
      }),
      this.prisma.marketplaceItem.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getItem(id: string) {
    const item = await this.prisma.marketplaceItem.findFirst({
      where: { id, isActive: true },
      include: {
        seller: { select: { id: true, name: true, logo: true } },
        reviews: {
          include: { buyer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { reviews: true, purchases: true } },
      },
    });
    if (!item) throw new NotFoundException('Marketplace item not found');
    return item;
  }

  async createItem(sellerId: string, dto: CreateMarketplaceItemDto) {
    const price = dto.price ?? 0;
    // P2-4: New items start as inactive (pending moderation).
    // Admin must approve via updateItem before they appear in public listings.
    return this.prisma.marketplaceItem.create({
      data: {
        sellerId,
        title: dto.title,
        description: dto.description ?? null,
        type: dto.type,
        category: dto.category ?? null,
        tags: dto.tags ?? [],
        price: new Decimal(price),
        currency: dto.currency ?? 'CHF',
        previewImages: dto.previewImages ?? [],
        fileUrl: dto.fileUrl ?? null,
        fileType: dto.fileType ?? null,
        isFeatured: dto.isFeatured ?? false,
        isActive: false,
        metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : undefined,
      },
      include: {
        seller: { select: { id: true, name: true, logo: true } },
      },
    });
  }

  async updateItem(id: string, sellerId: string, dto: UpdateMarketplaceItemDto) {
    const item = await this.prisma.marketplaceItem.findFirst({ where: { id } });
    if (!item) throw new NotFoundException('Marketplace item not found');
    if (item.sellerId !== sellerId) throw new ForbiddenException('Not the seller of this item');

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.price !== undefined) data.price = new Decimal(dto.price);
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.previewImages !== undefined) data.previewImages = dto.previewImages;
    if (dto.fileUrl !== undefined) data.fileUrl = dto.fileUrl;
    if (dto.fileType !== undefined) data.fileType = dto.fileType;
    if (dto.isFeatured !== undefined) data.isFeatured = dto.isFeatured;
    if (dto.metadata !== undefined) data.metadata = dto.metadata;

    return this.prisma.marketplaceItem.update({
      where: { id },
      data,
      include: {
        seller: { select: { id: true, name: true, logo: true } },
      },
    });
  }

  async deleteItem(id: string, sellerId: string) {
    const item = await this.prisma.marketplaceItem.findFirst({ where: { id } });
    if (!item) throw new NotFoundException('Marketplace item not found');
    if (item.sellerId !== sellerId) throw new ForbiddenException('Not the seller of this item');

    await this.prisma.marketplaceItem.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }

  async purchaseItem(itemId: string, buyerId: string) {
    const item = await this.prisma.marketplaceItem.findFirst({
      where: { id: itemId, isActive: true },
      include: { seller: { select: { id: true, subscriptionPlan: true, plan: true } } },
    });
    if (!item) throw new NotFoundException('Marketplace item not found');
    if (item.sellerId === buyerId) throw new ForbiddenException('Cannot purchase your own item');

    const priceCredits = Number(item.price ?? 0);
    if (priceCredits > 0) {
      try {
        await this.creditsService.deductCreditsByAmount(
          buyerId,
          priceCredits,
          'marketplace_purchase',
          { itemId },
        );
      } catch (err) {
        if (err instanceof BadRequestException) {
          throw err;
        }
        this.logger.warn('Credits deduction failed for marketplace purchase', { itemId, buyerId, err });
        throw new BadRequestException(
          err instanceof Error ? err.message : 'Insufficient credits for this purchase',
        );
      }
    }

    const sellerPlan = item.seller?.subscriptionPlan ?? item.seller?.plan ?? 'free';
    const commissionPercent = getMarketplaceCommission(String(sellerPlan));
    const priceCents = Math.round(Number(item.price ?? 0) * 100);
    const commissionCents = Math.round((priceCents * commissionPercent) / 100);

    const now = new Date();
    const payoutScheduledAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [purchase] = await this.prisma.$transaction([
      this.prisma.marketplacePurchase.create({
        data: {
          itemId,
          buyerId,
          price: item.price,
          currency: item.currency,
          status: 'COMPLETED',
          commissionPercent,
          commissionCents,
          payoutScheduledAt,
          payoutStatus: 'PENDING',
        },
        include: { item: true, buyer: { select: { id: true, name: true } } },
      }),
      this.prisma.marketplaceItem.update({
        where: { id: itemId },
        data: { downloads: { increment: 1 } },
      }),
    ]);
    return purchase;
  }

  async reviewItem(itemId: string, buyerId: string, rating: number, comment?: string) {
    const item = await this.prisma.marketplaceItem.findFirst({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Marketplace item not found');

    const existing = await this.prisma.marketplacePurchase.findFirst({
      where: { itemId, buyerId, status: 'COMPLETED' },
    });
    if (!existing) throw new ForbiddenException('You must purchase the item before reviewing');

    await this.prisma.marketplaceReview.upsert({
      where: {
        itemId_buyerId: { itemId, buyerId },
      },
      create: { itemId, buyerId, rating, comment: comment ?? null },
      update: { rating, comment: comment ?? null },
    });

    const reviews = await this.prisma.marketplaceReview.findMany({
      where: { itemId },
      select: { rating: true },
      take: 50,
    });
    const sum = reviews.reduce((a, r) => a + r.rating, 0);
    const avg = reviews.length ? sum / reviews.length : null;
    const ratingRounded = avg !== null ? Math.round(avg * 100) / 100 : null;

    await this.prisma.marketplaceItem.update({
      where: { id: itemId },
      data: {
        rating: ratingRounded !== null ? new Decimal(ratingRounded) : null,
        reviewCount: reviews.length,
      },
    });

    return this.prisma.marketplaceReview.findUnique({
      where: { itemId_buyerId: { itemId, buyerId } },
      include: { buyer: { select: { id: true, name: true } } },
    });
  }

  async getSellerDashboard(sellerId: string) {
    const [items, purchases, stats] = await Promise.all([
      this.prisma.marketplaceItem.findMany({
        where: { sellerId },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { reviews: true, purchases: true } },
        },
        take: 50,
      }),
      this.prisma.marketplacePurchase.findMany({
        where: { item: { sellerId } },
        include: { item: { select: { id: true, title: true } }, buyer: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.marketplacePurchase.aggregate({
        where: { item: { sellerId }, status: 'COMPLETED' },
        _sum: { price: true },
        _count: true,
      }),
    ]);

    const totalRevenue = stats._sum.price ?? new Decimal(0);
    const totalDownloads = items.reduce((acc, i) => acc + i.downloads, 0);
    const avgRating =
      items.length && items.some((i) => i.rating != null)
        ? items.reduce((acc, i) => acc + (i.rating ? Number(i.rating) : 0), 0) /
          items.filter((i) => i.rating != null).length
        : null;

    return {
      totalItems: items.length,
      totalRevenue: Number(totalRevenue),
      totalDownloads,
      avgRating: avgRating !== null ? Math.round(avgRating * 100) / 100 : null,
      items,
      recentPurchases: purchases,
    };
  }

  /**
   * Get seller statistics (for useSellerData hook)
   */
  async getSellerStats(sellerId: string) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(thisMonthStart.getTime() - 1);

    const [
      items,
      aggregate,
      refundedAggregate,
      thisMonthAggregate,
      lastMonthAggregate,
      reviewsCount,
    ] = await Promise.all([
      this.prisma.marketplaceItem.findMany({
        where: { sellerId },
        select: { id: true, rating: true, reviewCount: true, isActive: true },
      }),
      this.prisma.marketplacePurchase.aggregate({
        where: { item: { sellerId }, status: 'COMPLETED' },
        _sum: { price: true },
        _count: true,
      }),
      this.prisma.marketplacePurchase.aggregate({
        where: { item: { sellerId }, status: 'REFUNDED' },
        _sum: { price: true },
        _count: true,
      }),
      this.prisma.marketplacePurchase.aggregate({
        where: {
          item: { sellerId },
          status: 'COMPLETED',
          createdAt: { gte: thisMonthStart },
        },
        _sum: { price: true },
        _count: true,
      }),
      this.prisma.marketplacePurchase.aggregate({
        where: {
          item: { sellerId },
          status: 'COMPLETED',
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { price: true },
      }),
      this.prisma.marketplaceReview.count({
        where: { item: { sellerId } },
      }),
    ]);

    const totalRevenue = Number(aggregate._sum.price ?? 0);
    const ordersCount = aggregate._count;
    const lastMonthRevenue = Number(lastMonthAggregate._sum.price ?? 0);
    const thisMonthRevenue = Number(thisMonthAggregate._sum.price ?? 0);
    const thisMonthSales = thisMonthAggregate._count ?? 0;
    const refundsAmount = Number(refundedAggregate._sum.price ?? 0);
    const refundsCount = refundedAggregate._count;
    const revenueGrowth =
      lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    const activeProducts = items.filter((i) => i.isActive).length;
    const avgRating =
      items.length && items.some((i) => i.rating != null)
        ? items.reduce((acc, i) => acc + (i.rating ? Number(i.rating) : 0), 0) /
          items.filter((i) => i.rating != null).length
        : 0;
    const pendingOrders = 0; // Phase 8 marketplace uses COMPLETED status by default

    return {
      totalSales: ordersCount,
      totalRevenue,
      pendingPayout: 0,
      availableBalance: totalRevenue,
      totalTemplates: items.length,
      activeProducts,
      averageRating: Math.round(avgRating * 100) / 100,
      totalReviews: reviewsCount,
      thisMonthSales,
      thisMonthRevenue,
      lastMonthRevenue,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      ordersCount,
      pendingOrders,
      completedOrders: ordersCount,
      refundsCount,
      refundsAmount,
    };
  }

  /**
   * Get seller products (for useSellerData hook)
   */
  async getSellerProducts(sellerId: string) {
    const items = await this.prisma.marketplaceItem.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { reviews: true, purchases: true } },
      },
    });

    return items.map((item) => ({
      id: item.id,
      name: item.title,
      image: item.previewImages?.[0] ?? '',
      price: Number(item.price ?? 0),
      sales: item.downloads,
      revenue: item.downloads * Number(item.price ?? 0),
      stock: 0,
      status: (item.isActive ? 'active' : 'archived') as 'active' | 'draft' | 'archived',
      rating: Number(item.rating ?? 0),
      reviewsCount: item.reviewCount,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  /**
   * Get seller orders (for useSellerData hook)
   */
  async getSellerOrders(sellerId: string) {
    const purchases = await this.prisma.marketplacePurchase.findMany({
      where: { item: { sellerId } },
      orderBy: { createdAt: 'desc' },
      include: {
        item: { select: { id: true, title: true, previewImages: true } },
        buyer: { select: { id: true, name: true } },
      },
      take: 100,
    });

    return purchases.map((p) => ({
      id: p.id,
      orderNumber: p.id,
      customerName: p.buyer?.name ?? 'Unknown',
      productName: p.item.title,
      productImage: p.item.previewImages?.[0] ?? '',
      quantity: 1,
      total: Number(p.price ?? 0),
      commission: p.commissionCents != null ? p.commissionCents / 100 : 0,
      status: (p.status === 'COMPLETED' ? 'delivered' : p.status === 'REFUNDED' ? 'refunded' : 'pending') as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded',
      createdAt: p.createdAt.toISOString(),
    }));
  }

  /**
   * Get seller reviews (for useSellerData hook)
   */
  async getSellerReviews(sellerId: string) {
    const reviews = await this.prisma.marketplaceReview.findMany({
      where: { item: { sellerId } },
      orderBy: { createdAt: 'desc' },
      include: {
        item: { select: { id: true, title: true, previewImages: true } },
        buyer: { select: { id: true, name: true } },
      },
      take: 100,
    });

    return reviews.map((r) => ({
      id: r.id,
      customerName: r.buyer?.name ?? 'Unknown',
      productName: r.item.title,
      productImage: r.item.previewImages?.[0] ?? '',
      rating: r.rating,
      comment: r.comment ?? '',
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Get seller payouts (for useSellerData hook)
   * Returns real payout data from MarketplacePurchase (payoutScheduledAt, payoutStatus, paidOutAt).
   */
  async getSellerPayouts(sellerId: string) {
    const purchases = await this.prisma.marketplacePurchase.findMany({
      where: { item: { sellerId }, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      include: {
        item: { select: { id: true, title: true } },
        buyer: { select: { id: true, name: true } },
      },
      take: 100,
    });

    return purchases.map((p) => {
      const amount = Number(p.price ?? 0);
      return {
        id: p.id,
        purchaseId: p.id,
        amount,
        currency: p.currency ?? 'CHF',
        status: p.payoutStatus === 'COMPLETED' ? 'completed' : p.payoutStatus === 'FAILED' ? 'failed' : 'pending',
        scheduledAt: p.payoutScheduledAt?.toISOString() ?? null,
        paidAt: p.paidOutAt?.toISOString() ?? null,
        productName: p.item.title,
        customerName: p.buyer?.name ?? 'Unknown',
        createdAt: p.createdAt.toISOString(),
      };
    });
  }

  /**
   * Upload a file to Cloudinary for marketplace item
   */
  async uploadFile(
    file: Buffer,
    mimetype: string,
    originalname: string,
  ): Promise<{ url: string; fileType: string }> {
    const isImage = mimetype.startsWith('image/');
    const isVideo = mimetype.startsWith('video/');
    const folder = 'luneo/marketplace';

    let url: string;
    if (isVideo) {
      url = await this.cloudinary.uploadVideo(file, folder);
    } else if (isImage) {
      url = await this.cloudinary.uploadImage(file, folder);
    } else {
      // For other file types (GLB, OBJ, ZIP, etc.), upload as raw via image with auto resource type
      url = await this.cloudinary.uploadImage(file, folder);
    }

    // Determine file type from mimetype/extension
    const ext = originalname.split('.').pop()?.toLowerCase() ?? '';
    const fileType = ext || mimetype.split('/').pop() || 'unknown';

    this.logger.log(`Marketplace file uploaded: ${originalname} -> ${url}`);
    return { url, fileType };
  }

  /**
   * Get download URL for a purchased item
   */
  async getDownloadUrl(itemId: string, buyerId: string): Promise<{ url: string; fileName: string }> {
    const item = await this.prisma.marketplaceItem.findFirst({
      where: { id: itemId },
      select: { id: true, title: true, fileUrl: true, fileType: true, sellerId: true, price: true },
    });
    if (!item) throw new NotFoundException('Item not found');

    // Allow seller to download their own file
    if (item.sellerId !== buyerId) {
      // Check if free item or user has purchased
      const isFree = item.price !== null && Number(item.price) === 0;
      if (!isFree) {
        const purchase = await this.prisma.marketplacePurchase.findFirst({
          where: { itemId, buyerId, status: 'COMPLETED' },
        });
        if (!purchase) throw new ForbiddenException('You must purchase this item to download');
      }
    }

    if (!item.fileUrl) throw new NotFoundException('No file attached to this item');

    const extension = item.fileType ? `.${item.fileType}` : '';
    const fileName = `${item.title.replace(/[^a-zA-Z0-9_-]/g, '_')}${extension}`;

    return { url: item.fileUrl, fileName };
  }
}
