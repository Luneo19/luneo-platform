import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

interface RecommendedProduct {
  id: string;
  name: string;
  image: string | null;
  score: number;
  reason: string;
}

@Injectable()
export class TryOnRecommendationService {
  private readonly logger = new Logger(TryOnRecommendationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get real-time product recommendations based on the current try-on session.
   *
   * Algorithm:
   * 1. Get products already tried in this session
   * 2. Find similar products (same category, price range, style)
   * 3. Collaborative filtering: products tried by users with similar behavior
   * 4. Popularity: most-tried products for this brand
   * 5. Score and rank, return top N
   */
  async getRecommendations(
    sessionId: string,
    currentProductId?: string,
    limit = 5,
  ): Promise<RecommendedProduct[]> {
    const session = await this.prisma.tryOnSession.findUnique({
      where: { sessionId },
      select: {
        id: true,
        productsTried: true,
        configuration: {
          select: {
            productType: true,
            project: { select: { brandId: true } },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const brandId = session.configuration.project.brandId;
    const productsTried = (session.productsTried as string[]) || [];
    const excludeIds = currentProductId
      ? [...productsTried, currentProductId]
      : productsTried;

    // Strategy 1: Same category products not yet tried
    const categoryProducts = await this.prisma.product.findMany({
      where: {
        brandId,
        id: { notIn: excludeIds },
        status: 'ACTIVE',
        tryOnMappings: { some: {} }, // Must have a try-on mapping
      },
      select: {
        id: true,
        name: true,
        images: true,
        price: true,
        category: true,
      },
      take: limit * 2,
      orderBy: { createdAt: 'desc' },
    });

    // Strategy 2: Popular products (most tried in the last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const popularConversions = await this.prisma.tryOnConversion.groupBy({
      by: ['productId'],
      where: {
        brandId,
        productId: { notIn: excludeIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const popularProductIds = popularConversions.map((c) => c.productId);

    // Strategy 3: Collaborative filtering - products tried by similar sessions
    const similarSessions = await this.prisma.tryOnSession.findMany({
      where: {
        configuration: { project: { brandId } },
        productsTried: { not: null },
        id: { not: session.id },
      },
      select: { productsTried: true },
      take: 100,
      orderBy: { startedAt: 'desc' },
    });

    const collaborativeScores = new Map<string, number>();
    for (const s of similarSessions) {
      const tried = (s.productsTried as string[]) || [];
      const overlap = tried.filter((p) => productsTried.includes(p)).length;
      if (overlap === 0) continue;

      for (const p of tried) {
        if (!excludeIds.includes(p)) {
          collaborativeScores.set(
            p,
            (collaborativeScores.get(p) || 0) + overlap,
          );
        }
      }
    }

    // Combine and score
    const scored = new Map<string, { score: number; reason: string }>();

    for (const p of categoryProducts) {
      scored.set(p.id, {
        score: 1.0,
        reason: 'Meme categorie',
      });
    }

    for (const pId of popularProductIds) {
      const existing = scored.get(pId);
      scored.set(pId, {
        score: (existing?.score || 0) + 2.0,
        reason: existing ? `${existing.reason} + Populaire` : 'Populaire',
      });
    }

    for (const [pId, colScore] of collaborativeScores) {
      const existing = scored.get(pId);
      scored.set(pId, {
        score: (existing?.score || 0) + colScore * 0.5,
        reason: existing
          ? `${existing.reason} + Recommande`
          : 'Recommande pour vous',
      });
    }

    // Sort by score descending
    const sortedIds = Array.from(scored.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([id]) => id);

    if (sortedIds.length === 0) {
      return [];
    }

    // Fetch product details
    const products = await this.prisma.product.findMany({
      where: { id: { in: sortedIds } },
      select: {
        id: true,
        name: true,
        images: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return sortedIds
      .map((id) => {
        const product = productMap.get(id);
        if (!product) return null;

        const imgs = product.images as string[] | null;
        const image = Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : null;

        return {
          id: product.id,
          name: product.name,
          image,
          score: scored.get(id)?.score || 0,
          reason: scored.get(id)?.reason || '',
        };
      })
      .filter((p): p is RecommendedProduct => p !== null);
  }
}
