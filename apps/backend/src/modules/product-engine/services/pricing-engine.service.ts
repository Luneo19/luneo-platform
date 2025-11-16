import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import {
  PricingContext,
  DesignOptions,
  ProductRules,
  QuantityDiscount,
  BulkPricing,
  DesignImageZoneOptions,
  DesignTextZoneOptions,
  DesignColorZoneOptions,
  DesignSelectZoneOptions,
  DesignZoneOption,
  PricingSuggestion,
  PricingHistoryEntry,
  CompetitiveAnalysis,
  MarginAnalysis,
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

    for (const [zoneId, zoneOption] of Object.entries(options.zones)) {
      const zone = rules.zones.find((z) => z.id === zoneId);
      if (!zone) continue;

      const zoneBasePrice = zone.priceDeltaCents || 0;
      let zoneTypePrice = 0;

      switch (zone.type) {
        case 'image':
          zoneTypePrice = this.calculateImageZonePrice(this.ensureImageZoneOptions(zoneOption));
          break;
        case 'text':
          zoneTypePrice = this.calculateTextZonePrice(this.ensureTextZoneOptions(zoneOption));
          break;
        case 'color':
          zoneTypePrice = this.calculateColorZonePrice(this.ensureColorZoneOptions(zoneOption));
          break;
        case 'select':
          zoneTypePrice = this.calculateSelectZonePrice(this.ensureSelectZoneOptions(zoneOption));
          break;
      }

      totalZonePrice += zoneBasePrice + zoneTypePrice;
    }

    return totalZonePrice;
  }

  /**
   * Calcule le prix d'une zone image
   */
  private calculateImageZonePrice(options: DesignImageZoneOptions): number {
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
    if (typeof options.width === 'number' && typeof options.height === 'number') {
      const megapixels = (options.width * options.height) / 1_000_000;
      if (megapixels > 10) {
        price += 50; // Prix supplémentaire pour haute résolution
      }
    }

    // Prix pour effets spéciaux
    if (Array.isArray(options.effects)) {
      price += options.effects.length * 25; // 0.25€ par effet
    }

    return price;
  }

  /**
   * Calcule le prix d'une zone texte
   */
  private calculateTextZonePrice(options: DesignTextZoneOptions): number {
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
    if (Array.isArray(options.effects)) {
      price += options.effects.length * 30; // 0.30€ par effet
    }

    return price;
  }

  /**
   * Calcule le prix d'une zone couleur
   */
  private calculateColorZonePrice(options: DesignColorZoneOptions): number {
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
  private calculateSelectZonePrice(options: DesignSelectZoneOptions): number {
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
      const quantity = typeof value === 'number' && Number.isFinite(value) ? value : 1;
      totalMaterialPrice += materialPrice * quantity;
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
      const quantity = typeof value === 'number' && Number.isFinite(value) ? value : 1;
      totalFinishPrice += finishPrice * quantity;
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
    const sortedDiscounts = [...discounts].sort((a, b) => b.minQuantity - a.minQuantity);

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
    const sortedBulkPricing = [...bulkPricing].sort((a, b) => b.minQuantity - a.minQuantity);

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
  async getPricingSuggestions(productId: string): Promise<PricingSuggestion> {
    const cacheKey = `pricing_suggestions:${productId}`;
    
    const cached = await this.cache.getSimple(cacheKey);
    if (cached) {
      return cached as PricingSuggestion;
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
      const prices = recentSales.map((sale) => sale.totalCents / 100);
      const avgPrice = prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;

      // Analyse concurrentielle (simulation)
      const competitiveAnalysis: CompetitiveAnalysis = {
        marketAverage: avgPrice * 1.1,
        priceRange: {
          min: minPrice * 0.9,
          max: maxPrice * 1.1,
        },
        competitors: [
          { name: 'Acme Prints', price: avgPrice * 0.95 },
          { name: 'DesignMax', price: avgPrice * 1.12 },
          { name: 'Customo', price: avgPrice * 0.88 },
        ],
      };

      // Analyse des marges
      const marginAnalysis: MarginAnalysis = {
        currentMarginPercent: 35,
        targetMarginPercent: 40,
        recommendation: 'Augmentez le prix de base de 8 % pour aligner la marge sur l’objectif.',
      };

      // Historique des prix (simulation)
      const priceHistory: PricingHistoryEntry[] = Array.from({ length: 12 }, (_, index) => ({
        total: avgPrice * (1 + (Math.random() - 0.5) * 0.1),
        date: new Date(Date.now() - (11 - index) * 30 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const suggestion: PricingSuggestion = {
        recommendedBasePrice: avgPrice * 1.05,
        competitiveAnalysis,
        marginAnalysis,
        priceHistory,
      };

      // Mettre en cache pour 1 heure
      await this.cache.setSimple(cacheKey, suggestion, 3600);
      
      return suggestion;
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
        throw new Error(`Product ${productId} not found`);
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
      for (const zoneOption of Object.values(options.zones)) {
        const imageOptions = this.ensureImageZoneOptions(zoneOption);
        if (imageOptions.complexity === 'complex') {
          cost += 150; // 1.50€
        } else if (imageOptions.complexity === 'medium') {
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
      const complexZones = Object.values(options.zones).filter((zoneOption) => {
        const imageOptions = this.ensureImageZoneOptions(zoneOption);
        return imageOptions.complexity === 'complex';
      }).length;
      
      if (complexZones > 2) {
        margin += 0.05; // +5% pour designs très complexes
      }
    }

    return Math.min(margin, 0.60); // Marge max 60%
  }

  private ensureImageZoneOptions(option: DesignZoneOption | undefined): DesignImageZoneOptions {
    if (!option || typeof option !== 'object') {
      return {};
    }
    return option as DesignImageZoneOptions;
  }

  private ensureTextZoneOptions(option: DesignZoneOption | undefined): DesignTextZoneOptions {
    if (!option || typeof option !== 'object') {
      return {};
    }
    return option as DesignTextZoneOptions;
  }

  private ensureColorZoneOptions(option: DesignZoneOption | undefined): DesignColorZoneOptions {
    if (!option || typeof option !== 'object') {
      return {};
    }
    return option as DesignColorZoneOptions;
  }

  private ensureSelectZoneOptions(option: DesignZoneOption | undefined): DesignSelectZoneOptions {
    if (!option || typeof option !== 'object') {
      return {};
    }
    return option as DesignSelectZoneOptions;
  }
}


