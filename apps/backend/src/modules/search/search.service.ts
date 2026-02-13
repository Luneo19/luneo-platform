import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '@/common/types/user.types';
import { UserRole } from '@prisma/client';

export interface SearchResultItem {
  id: string;
  type: 'product' | 'design' | 'order';
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  url: string;
}

export interface SearchResults {
  results: {
    products: SearchResultItem[];
    designs: SearchResultItem[];
    orders: SearchResultItem[];
  };
  total: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(currentUser: CurrentUser, q: string, types?: string): Promise<SearchResults> {
    const term = (q || '').trim();
    const typeList = types
      ? types.split(',').map((t) => t.trim().toLowerCase())
      : ['products', 'designs', 'orders'];

    const brandFilter =
      currentUser.role === UserRole.PLATFORM_ADMIN
        ? {}
        : { brandId: currentUser.brandId ?? undefined };

    const results: SearchResults['results'] = {
      products: [],
      designs: [],
      orders: [],
    };

    if (term.length === 0) {
      return { results, total: 0 };
    }

    const searchMode = 'insensitive' as const;
    let total = 0;

    if (typeList.includes('products')) {
      const products = await this.prisma.product.findMany({
        where: {
          ...brandFilter,
          OR: [
            { name: { contains: term, mode: searchMode } },
            { description: { contains: term, mode: searchMode } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          thumbnailUrl: true,
          images: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      results.products = products.map((p) => ({
        id: p.id,
        type: 'product' as const,
        title: p.name,
        subtitle: p.description ?? undefined,
        imageUrl: p.thumbnailUrl ?? (Array.isArray(p.images) && p.images.length ? p.images[0] : null),
        url: `/dashboard/products/${p.id}`,
      }));
      total += results.products.length;
    }

    if (typeList.includes('designs')) {
      const designs = await this.prisma.design.findMany({
        where: {
          ...brandFilter,
          OR: [
            { name: { contains: term, mode: searchMode } },
            { prompt: { contains: term, mode: searchMode } },
          ],
        },
        select: {
          id: true,
          name: true,
          prompt: true,
          imageUrl: true,
          previewUrl: true,
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      results.designs = designs.map((d) => ({
        id: d.id,
        type: 'design' as const,
        title: d.name || d.prompt?.slice(0, 50) || 'Design',
        subtitle: d.prompt?.slice(0, 80),
        imageUrl: d.imageUrl ?? d.previewUrl ?? null,
        url: `/dashboard/designs/${d.id}`,
      }));
      total += results.designs.length;
    }

    if (typeList.includes('orders')) {
      const orders = await this.prisma.order.findMany({
        where: {
          ...brandFilter,
          orderNumber: { contains: term, mode: searchMode },
        },
        select: {
          id: true,
          orderNumber: true,
          customerEmail: true,
          totalCents: true,
          currency: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      results.orders = orders.map((o) => ({
        id: o.id,
        type: 'order' as const,
        title: o.orderNumber,
        subtitle: o.customerEmail ?? undefined,
        imageUrl: null,
        url: `/dashboard/orders/${o.id}`,
      }));
      total += results.orders.length;
    }

    return { results, total };
  }
}
