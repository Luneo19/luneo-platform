import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface RoutingCriteria {
  orderId: string;
  productId: string;
  material?: string;
  technique?: string;
  quantity?: number;
  urgency?: 'standard' | 'express' | 'rush';
  maxPrice?: number; // cents
  maxLeadTime?: number; // days
  preferredZones?: string[];
}

export interface ArtisanMatch {
  artisanId: string;
  artisan: any;
  score: number;
  quote: {
    priceCents: number;
    leadTime: number;
    breakdown: any;
  };
  reasons: string[];
}

@Injectable()
export class OrderRoutingService {
  private readonly logger = new Logger(OrderRoutingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Trouve les meilleurs artisans pour une commande
   */
  async findBestArtisans(criteria: RoutingCriteria, limit: number = 3): Promise<ArtisanMatch[]> {
    this.logger.log(`Finding artisans for order ${criteria.orderId}`, criteria);

    // 1. Récupérer les artisans actifs et vérifiés avec eager loading
    const artisans = await this.prisma.artisan.findMany({
      where: {
        status: 'active',
        kycStatus: 'verified',
        // Pas en quarantaine
        OR: [
          { quarantineUntil: null },
          { quarantineUntil: { lt: new Date() } },
        ],
      },
      include: {
        capabilities: true,
      },
    });

    // 2. Filtrer par capacités
    const matchingArtisans = artisans.filter((artisan) => {
      // Vérifier matériaux supportés
      if (criteria.material && !artisan.supportedMaterials.includes(criteria.material)) {
        return false;
      }

      // Vérifier techniques supportées
      if (criteria.technique && !artisan.supportedTechniques.includes(criteria.technique)) {
        return false;
      }

      // Vérifier capacité (charge actuelle < max)
      if (artisan.currentLoad >= artisan.maxVolume) {
        return false;
      }

      return true;
    });

    // 3. Calculer les scores pour chaque artisan
    const matches: ArtisanMatch[] = await Promise.all(
      matchingArtisans.map(async (artisan) => {
        const quote = await this.calculateQuote(artisan, criteria);
        const score = await this.calculateScore(artisan, quote, criteria);
        const reasons = this.generateReasons(artisan, quote, criteria);

        return {
          artisanId: artisan.id,
          artisan,
          score,
          quote,
          reasons,
        };
      }),
    );

    // 4. Trier par score et retourner les meilleurs
    matches.sort((a, b) => b.score - a.score);

    return matches.slice(0, limit);
  }

  /**
   * Calcule un devis pour un artisan
   */
  private async calculateQuote(artisan: any, criteria: RoutingCriteria) {
    // Récupérer le produit pour avoir le coût de base
    const product = await this.prisma.product.findUnique({
      where: { id: criteria.productId },
      select: { baseCostCents: true, laborCostCents: true },
    });

    const baseCost = product?.baseCostCents || 0;
    const baseLabor = product?.laborCostCents || 0;

    // Appliquer le multiplier de capacité si applicable
    const capability = artisan.capabilities.find(
      (cap: any) =>
        cap.material === criteria.material && cap.technique === criteria.technique,
    );

    const costMultiplier = capability?.costMultiplier || 1.0;
    const priceCents = Math.round((baseCost + baseLabor) * costMultiplier);

    // Calculer lead time
    const baseLeadTime = capability?.leadTime || artisan.averageLeadTime;
    const leadTime = criteria.urgency === 'express' ? Math.max(1, baseLeadTime - 2) : baseLeadTime;

    return {
      priceCents,
      leadTime,
      breakdown: {
        baseCost,
        laborCost: baseLabor,
        multiplier: costMultiplier,
        urgency: criteria.urgency,
      },
    };
  }

  /**
   * Calcule un score pour un artisan
   */
  private async calculateScore(
    artisan: any,
    quote: { priceCents: number; leadTime: number },
    criteria: RoutingCriteria,
  ): Promise<number> {
    let score = 0;

    // 1. Score qualité (40%)
    const qualityScore = artisan.qualityScore || 5.0;
    score += (qualityScore / 5.0) * 40;

    // 2. Score coût (25%)
    if (criteria.maxPrice) {
      const costRatio = Math.min(1, criteria.maxPrice / quote.priceCents);
      score += costRatio * 25;
    } else {
      // Plus le prix est bas, mieux c'est (normalisé)
      const normalizedPrice = Math.max(0, 1 - quote.priceCents / 100000); // 1000€ max
      score += normalizedPrice * 25;
    }

    // 3. Score délai (20%)
    if (criteria.maxLeadTime) {
      const leadTimeRatio = Math.min(1, criteria.maxLeadTime / quote.leadTime);
      score += leadTimeRatio * 20;
    } else {
      // Plus le délai est court, mieux c'est
      const normalizedLeadTime = Math.max(0, 1 - quote.leadTime / 30); // 30 jours max
      score += normalizedLeadTime * 20;
    }

    // 4. Score performance (15%)
    const onTimeRate = artisan.onTimeDeliveryRate || 1.0;
    const defectRate = artisan.defectRate || 0.0;
    const returnRate = artisan.returnRate || 0.0;
    const performanceScore = onTimeRate * (1 - defectRate) * (1 - returnRate);
    score += performanceScore * 15;

    return Math.round(score * 100) / 100; // Arrondir à 2 décimales
  }

  /**
   * Génère les raisons du matching
   */
  private generateReasons(
    artisan: any,
    quote: { priceCents: number; leadTime: number },
    criteria: RoutingCriteria,
  ): string[] {
    const reasons: string[] = [];

    if (artisan.qualityScore >= 4.5) {
      reasons.push('High quality score');
    }

    if (artisan.onTimeDeliveryRate >= 0.95) {
      reasons.push('Excellent on-time delivery');
    }

    if (quote.priceCents < (criteria.maxPrice || 100000)) {
      reasons.push('Competitive pricing');
    }

    if (quote.leadTime <= (criteria.maxLeadTime || 14)) {
      reasons.push('Fast lead time');
    }

    if (artisan.totalOrders > 50) {
      reasons.push('Experienced artisan');
    }

    return reasons;
  }

  /**
   * Route une commande vers un artisan (crée WorkOrder + Quote)
   */
  async routeOrder(orderId: string, artisanId: string, quote: {
    priceCents: number;
    leadTime: number;
    breakdown: any;
  }) {
    // Récupérer l'ordre
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Récupérer l'artisan
    const artisan = await this.prisma.artisan.findUnique({
      where: { id: artisanId },
    });

    if (!artisan) {
      throw new Error(`Artisan ${artisanId} not found`);
    }

    // Calculer le score de routage
    const routingScore = await this.calculateScore(
      artisan,
      quote,
      { orderId, productId: order.productId },
    );

    // Créer le Quote
    const quoteRecord = await this.prisma.quote.create({
      data: {
        orderId,
        artisanId,
        priceCents: quote.priceCents,
        leadTime: quote.leadTime,
        breakdown: quote.breakdown as any,
        overallScore: routingScore,
        status: 'selected',
        selectedAt: new Date(),
      },
    });

    // Créer le WorkOrder
    const workOrder = await this.prisma.workOrder.create({
      data: {
        orderId,
        artisanId,
        quoteId: quoteRecord.id,
        routingScore,
        routingReason: 'Automated routing',
        selectedAt: new Date(),
        status: 'assigned',
        payoutAmountCents: quote.priceCents,
        commissionCents: Math.round(quote.priceCents * 0.1), // 10% commission
        slaDeadline: new Date(Date.now() + quote.leadTime * 24 * 60 * 60 * 1000),
      },
    });

    // Mettre à jour la charge de l'artisan
    await this.prisma.artisan.update({
      where: { id: artisanId },
      data: {
        currentLoad: artisan.currentLoad + 1,
      },
    });

    this.logger.log(`Order ${orderId} routed to artisan ${artisanId}`);

    return { workOrder, quote: quoteRecord };
  }
}

































