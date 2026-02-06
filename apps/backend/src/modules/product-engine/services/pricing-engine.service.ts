import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { 
  PricingContext, 
  PricingRules, 
  DesignOptions,
  ProductRules,
  QuantityDiscount,
  BulkPricing
} from '../interfaces/product-rules.interface';

@Injectable()
export class PricingEngine {
  private readonly logger = new Logger(PricingEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Calcule le prix total d'un design personnalisé
   */
  async calculatePrice(context: PricingContext): Promise<{
    basePrice: number;
    zonePrice: number;
    materialPrice: number;
    finishPrice: number;
    quantityPrice: number;
    discount: number;
    totalPrice: number;
    breakdown: Record<string, number>;
  }> {
    try {
      const { baseProduct, options, rules, brandTier = 'professional', quantity } = context;
      
      // Prix de base
      const basePrice = baseProduct.price;
      
      // Prix des zones
      const zonePrice = this.calculateZonePrice(options, rules);
      
      // Prix des matériaux
      const materialPrice = this.calculateMaterialPrice(options, rules);
      
      // Prix des finitions
      const finishPrice = this.calculateFinishPrice(options, rules);
      
      // Prix unitaire total (avant quantité)
      const unitPrice = basePrice + zonePrice + materialPrice + finishPrice;
      
      // Calcul des remises de quantité
      const quantityDiscount = this.calculateQuantityDiscount(unitPrice, quantity, rules.pricing?.quantityDiscounts || []);
      
      // Calcul du prix de quantité
      const quantityPrice = this.calculateQuantityPrice(unitPrice, quantity, rules.pricing?.bulkPricing || []);
      
      // Application des remises
      const discount = quantityDiscount;
      const finalUnitPrice = quantityPrice;
      const totalPrice = finalUnitPrice * quantity;
      
      const breakdown = {
        base: basePrice,
        zones: zonePrice,
        material: materialPrice,
        finish: finishPrice,
        quantity: quantityPrice - unitPrice,
        discount: discount,
        unit: finalUnitPrice,
        total: totalPrice,
      };

      // Log pour audit
      this.logger.debug(`Price calculation for product ${baseProduct.id}:`, {
        basePrice,
        zonePrice,
        materialPrice,
        finishPrice,
        quantity,
        totalPrice,
        brandTier,
      });

      return {
        basePrice,
        zonePrice,
        materialPrice,
        finishPrice,
        quantityPrice: finalUnitPrice,
        discount,
        totalPrice,
        breakdown,
      };
    } catch (error) {
      this.logger.error('Error calculating price:', error);
      throw error;
    }
  }

  /**
   * Calcule le prix des zones personnalisées
   */
  private calculateZonePrice(options: DesignOptions, rules: ProductRules): number {
    if (!options.zones || !rules.zones) return 0;

    let totalZonePrice = 0;

    for (const [zoneId, zoneOptions] of Object.entries(options.zones)) {
      const zone = rules.zones.find(z => z.id === zoneId);
      if (!zone) continue;

      // Prix de base de la zone
      const zoneBasePrice = zone.priceDeltaCents || 0;
      
      // Prix selon le type de zone
      let zoneTypePrice = 0;
      
      switch (zone.type) {
        case 'image':
          zoneTypePrice = this.calculateImageZonePrice(zoneOptions);
          break;
        case 'text':
          zoneTypePrice = this.calculateTextZonePrice(zoneOptions);
          break;
        case 'color':
          zoneTypePrice = this.calculateColorZonePrice(zoneOptions);
          break;
        case 'select':
          zoneTypePrice = this.calculateSelectZonePrice(zoneOptions);
          break;
      }

      totalZonePrice += zoneBasePrice + zoneTypePrice;
    }

    return totalZonePrice;
  }

  /**
   * Calcule le prix d'une zone image
   */
  private calculateImageZonePrice(options: any): number {
    let price = 0;

    // Prix basé sur la complexité de l'image
    if (options.complexity) {
      switch (options.complexity) {
        case 'simple':
          price += 50; // 0.50€
          break;
        case 'medium':
          price += 100; // 1.00€
          break;
        case 'complex':
          price += 200; // 2.00€
          break;
      }
    }

    // Prix basé sur la résolution
    if (options.width && options.height) {
      const megapixels = (options.width * options.height) / 1000000;
      if (megapixels > 10) {
        price += 50; // Prix supplémentaire pour haute résolution
      }
    }

    // Prix pour effets spéciaux
    if (options.effects) {
      price += options.effects.length * 25; // 0.25€ par effet
    }

    return price;
  }

  /**
   * Calcule le prix d'une zone texte
   */
  private calculateTextZonePrice(options: any): number {
    let price = 0;

    // Prix basé sur la longueur du texte
    if (options.text && options.text.length > 10) {
      price += Math.ceil(options.text.length / 10) * 25; // 0.25€ par 10 caractères
    }

    // Prix pour polices premium
    if (options.font && this.isPremiumFont(options.font)) {
      price += 75; // 0.75€ pour police premium
    }

    // Prix pour effets de texte
    if (options.effects) {
      price += options.effects.length * 30; // 0.30€ par effet
    }

    return price;
  }

  /**
   * Calcule le prix d'une zone couleur
   */
  private calculateColorZonePrice(options: any): number {
    let price = 0;

    // Prix pour couleurs métalliques ou spéciales
    if (options.color && this.isSpecialColor(options.color)) {
      price += 100; // 1.00€ pour couleur spéciale
    }

    // Prix pour dégradés
    if (options.gradient) {
      price += 50; // 0.50€ pour dégradé
    }

    return price;
  }

  /**
   * Calcule le prix d'une zone de sélection
   */
  private calculateSelectZonePrice(options: any): number {
    let price = 0;

    // Prix pour options premium
    if (options.value && this.isPremiumOption(options.value)) {
      price += 75; // 0.75€ pour option premium
    }

    return price;
  }

  /**
   * Calcule le prix des matériaux
   */
  private calculateMaterialPrice(options: DesignOptions, rules: ProductRules): number {
    if (!options.materials || !rules.pricing?.materialPricing) return 0;

    let totalMaterialPrice = 0;

    for (const [material, value] of Object.entries(options.materials)) {
      const materialPrice = rules.pricing.materialPricing[material] || 0;
      totalMaterialPrice += materialPrice * (typeof value === 'number' ? value : 1);
    }

    return totalMaterialPrice;
  }

  /**
   * Calcule le prix des finitions
   */
  private calculateFinishPrice(options: DesignOptions, rules: ProductRules): number {
    if (!options.finishes || !rules.pricing?.finishPricing) return 0;

    let totalFinishPrice = 0;

    for (const [finish, value] of Object.entries(options.finishes)) {
      const finishPrice = rules.pricing.finishPricing[finish] || 0;
      totalFinishPrice += finishPrice * (typeof value === 'number' ? value : 1);
    }

    return totalFinishPrice;
  }

  /**
   * Calcule les remises de quantité
   */
  private calculateQuantityDiscount(
    unitPrice: number,
    quantity: number,
    discounts: QuantityDiscount[]
  ): number {
    if (!discounts.length) return 0;

    // Trier les remises par quantité décroissante
    const sortedDiscounts = discounts.sort((a, b) => b.minQuantity - a.minQuantity);

    // Trouver la remise applicable
    for (const discount of sortedDiscounts) {
      if (quantity >= discount.minQuantity) {
        return (unitPrice * discount.discountPercent) / 100;
      }
    }

    return 0;
  }

  /**
   * Calcule le prix selon la quantité (pricing en volume)
   */
  private calculateQuantityPrice(
    unitPrice: number,
    quantity: number,
    bulkPricing: BulkPricing[]
  ): number {
    if (!bulkPricing.length) return unitPrice;

    // Trier par quantité décroissante
    const sortedBulkPricing = bulkPricing.sort((a, b) => b.minQuantity - a.minQuantity);

    // Trouver le prix en volume applicable
    for (const pricing of sortedBulkPricing) {
      if (quantity >= pricing.minQuantity) {
        return pricing.pricePerUnit;
      }
    }

    return unitPrice;
  }

  /**
   * Vérifie si une police est premium
   */
  private isPremiumFont(font: string): boolean {
    const premiumFonts = [
      'helvetica-neue',
      'futura',
      'bodoni',
      'garamond',
      'times-new-roman',
    ];
    return premiumFonts.includes(font.toLowerCase());
  }

  /**
   * Vérifie si une couleur est spéciale
   */
  private isSpecialColor(color: string): boolean {
    const specialColors = [
      'gold',
      'silver',
      'rose-gold',
      'platinum',
      'copper',
      'bronze',
    ];
    return specialColors.includes(color.toLowerCase());
  }

  /**
   * Vérifie si une option est premium
   */
  private isPremiumOption(option: string): boolean {
    const premiumOptions = [
      'premium',
      'deluxe',
      'luxury',
      'professional',
      'enterprise',
    ];
    return premiumOptions.some(premium => 
      option.toLowerCase().includes(premium)
    );
  }

  /**
   * Obtient les suggestions de prix pour optimiser les ventes
   */
  async getPricingSuggestions(productId: string): Promise<{
    recommendedBasePrice: number;
    competitiveAnalysis: any;
    marginAnalysis: any;
    priceHistory: any[];
  }> {
    const cacheKey = `pricing_suggestions:${productId}`;
    
    const cached = await this.cache.getSimple<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached) as {
        recommendedBasePrice: number;
        competitiveAnalysis: any;
        marginAnalysis: any;
        priceHistory: any[];
      };
    }

    try {
      // Analyser les ventes récentes
      const recentSales = await this.prisma.order.findMany({
        where: {
          productId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
          },
        },
        select: {
          totalCents: true,
          createdAt: true,
        },
      });

      // Calculer les statistiques de prix
      const prices = recentSales.map(sale => sale.totalCents / 100);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Analyse concurrentielle (simulation)
      const competitiveAnalysis = {
        marketAverage: avgPrice * 1.1, // +10% vs moyenne interne
        priceRange: {
          min: minPrice * 0.9,
          max: maxPrice * 1.1,
        },
        recommendations: [
          {
            strategy: 'competitive',
            price: avgPrice * 0.95,
            reasoning: 'Prix compétitif pour gagner des parts de marché',
          },
          {
            strategy: 'premium',
            price: avgPrice * 1.15,
            reasoning: 'Positionnement premium pour maximiser les marges',
          },
          {
            strategy: 'volume',
            price: avgPrice * 0.85,
            reasoning: 'Prix attractif pour stimuler les ventes',
          },
        ],
      };

      // Analyse des marges
      const marginAnalysis = {
        currentMargin: 0.35, // 35% (simulation)
        targetMargin: 0.40, // 40%
        costBreakdown: {
          materials: 0.40,
          labor: 0.15,
          overhead: 0.10,
          profit: 0.35,
        },
      };

      // Historique des prix réel depuis les commandes
      const priceHistory = await this.getPriceHistory(productId, avgPrice);

      const suggestions = {
        recommendedBasePrice: avgPrice,
        competitiveAnalysis,
        marginAnalysis,
        priceHistory,
      };

      // Mettre en cache pour 1 heure
      await this.cache.setSimple(cacheKey, JSON.stringify(suggestions), 3600);
      
      return suggestions;
    } catch (error) {
      this.logger.error(`Error getting pricing suggestions for ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Calcule le prix de revient d'un produit
   */
  async calculateCostPrice(productId: string, options: DesignOptions): Promise<{
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    totalCost: number;
    margin: number;
  }> {
    try {
      // Récupérer les coûts de base du produit
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: {
          baseCostCents: true,
          laborCostCents: true,
          overheadCostCents: true,
        },
      });

      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      // Coût de base
      const baseCost = product.baseCostCents || 0;
      
      // Coût des matériaux personnalisés
      const materialCost = this.calculateCustomMaterialCost(options);
      
      // Coût de la main d'œuvre
      const laborCost = product.laborCostCents || 0;
      
      // Coût des frais généraux
      const overheadCost = product.overheadCostCents || 0;
      
      // Coût total
      const totalCost = baseCost + materialCost + laborCost + overheadCost;
      
      // Marge (simulation basée sur les options)
      const margin = this.calculateMargin(totalCost, options);

      return {
        materialCost,
        laborCost,
        overheadCost,
        totalCost,
        margin,
      };
    } catch (error) {
      this.logger.error(`Error calculating cost price for ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Calcule le coût des matériaux personnalisés
   */
  private calculateCustomMaterialCost(options: DesignOptions): number {
    let cost = 0;

    // Coût basé sur la complexité des zones
    if (options.zones) {
      for (const [zoneId, zoneOptions] of Object.entries(options.zones)) {
        // Coût pour zones complexes
        if (zoneOptions.complexity === 'complex') {
          cost += 150; // 1.50€
        } else if (zoneOptions.complexity === 'medium') {
          cost += 75; // 0.75€
        }
      }
    }

    return cost;
  }

  /**
   * Calcule la marge recommandée
   */
  private calculateMargin(cost: number, options: DesignOptions): number {
    let margin = 0.35; // Marge de base 35%

    // Ajuster la marge selon la complexité
    if (options.zones) {
      const complexZones = Object.values(options.zones).filter(
        (zone: any) => zone.complexity === 'complex'
      ).length;
      
      if (complexZones > 2) {
        margin += 0.05; // +5% pour designs très complexes
      }
    }

    return Math.min(margin, 0.60); // Marge max 60%
  }

  /**
   * Récupère l'historique réel des prix depuis les commandes
   */
  private async getPriceHistory(
    productId: string,
    fallbackAvgPrice: number,
  ): Promise<Array<{ month: Date; price: number; sales: number }>> {
    try {
      // Query orders for the last 12 months grouped by month
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const orders = await this.prisma.order.findMany({
        where: {
          createdAt: {
            gte: twelveMonthsAgo,
          },
          items: {
            some: {
              productId,
            },
          },
        },
        select: {
          createdAt: true,
          items: {
            where: {
              productId,
            },
            select: {
              priceCents: true,
              quantity: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Group by month
      const monthlyData = new Map<string, { totalPrice: number; totalSales: number; count: number }>();

      for (const order of orders) {
        const monthKey = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthlyData.get(monthKey) || { totalPrice: 0, totalSales: 0, count: 0 };

        for (const item of order.items) {
          existing.totalPrice += item.priceCents;
          existing.totalSales += item.quantity;
          existing.count += 1;
        }

        monthlyData.set(monthKey, existing);
      }

      // Convert to array and fill missing months
      const result: Array<{ month: Date; price: number; sales: number }> = [];
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const data = monthlyData.get(monthKey);

        if (data && data.count > 0) {
          result.push({
            month: new Date(date),
            price: (data.totalPrice / data.count) / 100, // Convert cents to euros
            sales: data.totalSales,
          });
        } else {
          // No data for this month - use fallback
          result.push({
            month: new Date(date),
            price: fallbackAvgPrice,
            sales: 0,
          });
        }
      }

      return result;
    } catch (error) {
      this.logger.warn(`Failed to get price history for ${productId}, using fallback`);
      
      // Return empty history with fallback prices
      return Array.from({ length: 12 }, (_, i) => ({
        month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000),
        price: fallbackAvgPrice,
        sales: 0,
      }));
    }
  }
}


