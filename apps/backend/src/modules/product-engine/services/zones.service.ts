import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import {
  ProductZone,
  ProductRules,
  DesignOptions,
  DesignZoneOption,
  CompatibilityRule,
} from '../interfaces/product-rules.interface';

@Injectable()
export class ZonesService {
  private readonly logger = new Logger(ZonesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Crée une nouvelle zone pour un produit
   */
  async createZone(productId: string, zone: Omit<ProductZone, 'id'>): Promise<ProductZone> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { rulesJson: true },
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      const rules = this.parseRules(product.rulesJson);

      const zoneId = this.generateZoneId();

      const newZone: ProductZone = {
        ...zone,
        id: zoneId,
      };

      rules.zones.push(newZone);

      await this.prisma.product.update({
        where: { id: productId },
        data: { rulesJson: this.serializeRules(rules) },
      });

      // Invalider le cache
      await this.cache.delSimple(`product_rules:${productId}`);

      this.logger.log(`Created zone ${zoneId} for product ${productId}`);
      
      return newZone;
    } catch (error) {
      this.logger.error(`Error creating zone for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Met à jour une zone existante
   */
  async updateZone(productId: string, zoneId: string, updates: Partial<ProductZone>): Promise<ProductZone> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { rulesJson: true },
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      const rules = this.parseRules(product.rulesJson);
      const zoneIndex = rules.zones.findIndex((z) => z.id === zoneId);

      if (zoneIndex === -1) {
        throw new Error(`Zone ${zoneId} not found`);
      }

      // Mettre à jour la zone
      rules.zones[zoneIndex] = {
        ...rules.zones[zoneIndex],
        ...updates,
        id: zoneId,
      };

      await this.prisma.product.update({
        where: { id: productId },
        data: { rulesJson: this.serializeRules(rules) },
      });

      // Invalider le cache
      await this.cache.delSimple(`product_rules:${productId}`);

      this.logger.log(`Updated zone ${zoneId} for product ${productId}`);
      
      return rules.zones[zoneIndex];
    } catch (error) {
      this.logger.error(`Error updating zone ${zoneId} for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Supprime une zone
   */
  async deleteZone(productId: string, zoneId: string): Promise<void> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { rulesJson: true },
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      const rules = this.parseRules(product.rulesJson);
      const zoneIndex = rules.zones.findIndex((z) => z.id === zoneId);

      if (zoneIndex === -1) {
        throw new Error(`Zone ${zoneId} not found`);
      }

      // Supprimer la zone
      rules.zones.splice(zoneIndex, 1);

      await this.prisma.product.update({
        where: { id: productId },
        data: { rulesJson: this.serializeRules(rules) },
      });

      // Invalider le cache
      await this.cache.delSimple(`product_rules:${productId}`);

      this.logger.log(`Deleted zone ${zoneId} for product ${productId}`);
    } catch (error) {
      this.logger.error(`Error deleting zone ${zoneId} for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Duplique une zone existante
   */
  async duplicateZone(productId: string, zoneId: string): Promise<ProductZone> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { rulesJson: true },
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      const rules = this.parseRules(product.rulesJson);
      const originalZone = rules.zones.find((z) => z.id === zoneId);

      if (!originalZone) {
        throw new Error(`Zone ${zoneId} not found`);
      }

      // Créer une copie avec un nouvel ID
      const newZoneId = this.generateZoneId();
      const duplicatedZone: ProductZone = {
        ...originalZone,
        id: newZoneId,
        label: `${originalZone.label} (Copie)`,
        x: originalZone.x + 20, // Décaler légèrement
        y: originalZone.y + 20,
      };

      rules.zones.push(duplicatedZone);

      await this.prisma.product.update({
        where: { id: productId },
        data: { rulesJson: this.serializeRules(rules) },
      });

      // Invalider le cache
      await this.cache.delSimple(`product_rules:${productId}`);

      this.logger.log(`Duplicated zone ${zoneId} to ${newZoneId} for product ${productId}`);
      
      return duplicatedZone;
    } catch (error) {
      this.logger.error(`Error duplicating zone ${zoneId} for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Obtient toutes les zones d'un produit
   */
  async getZones(productId: string): Promise<ProductZone[]> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { rulesJson: true },
      });

      if (!product) {
        return [];
      }

      const rules = this.parseRules(product.rulesJson);
      return rules.zones;
    } catch (error) {
      this.logger.error(`Error getting zones for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Obtient une zone spécifique
   */
  async getZone(productId: string, zoneId: string): Promise<ProductZone | null> {
    try {
      const zones = await this.getZones(productId);
      return zones.find(z => z.id === zoneId) || null;
    } catch (error) {
      this.logger.error(`Error getting zone ${zoneId} for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Réorganise l'ordre des zones
   */
  async reorderZones(productId: string, zoneIds: string[]): Promise<ProductZone[]> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { rulesJson: true },
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      const rules = this.parseRules(product.rulesJson);

      const reorderedZones: ProductZone[] = [];

      for (const zoneId of zoneIds) {
        const zone = rules.zones.find((z) => z.id === zoneId);
        if (zone) {
          reorderedZones.push(zone);
        }
      }

      for (const zone of rules.zones) {
        if (!zoneIds.includes(zone.id)) {
          reorderedZones.push(zone);
        }
      }

      rules.zones = reorderedZones;

      await this.prisma.product.update({
        where: { id: productId },
        data: { rulesJson: this.serializeRules(rules) },
      });

      // Invalider le cache
      await this.cache.delSimple(`product_rules:${productId}`);

      this.logger.log(`Reordered zones for product ${productId}`);
      
      return reorderedZones;
    } catch (error) {
      this.logger.error(`Error reordering zones for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Valide les coordonnées d'une zone
   */
  validateZoneCoordinates(zone: Partial<ProductZone>, canvasWidth: number, canvasHeight: number): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifier les coordonnées
    if (zone.x !== undefined && (zone.x < 0 || zone.x >= canvasWidth)) {
      errors.push(`Position X (${zone.x}) en dehors des limites du canvas (0-${canvasWidth})`);
    }

    if (zone.y !== undefined && (zone.y < 0 || zone.y >= canvasHeight)) {
      errors.push(`Position Y (${zone.y}) en dehors des limites du canvas (0-${canvasHeight})`);
    }

    // Vérifier les dimensions
    if (zone.width !== undefined && zone.width <= 0) {
      errors.push('La largeur doit être positive');
    }

    if (zone.height !== undefined && zone.height <= 0) {
      errors.push('La hauteur doit être positive');
    }

    // Vérifier que la zone ne dépasse pas les limites
    if (zone.x !== undefined && zone.width !== undefined && zone.x + zone.width > canvasWidth) {
      errors.push('La zone dépasse la largeur du canvas');
    }

    if (zone.y !== undefined && zone.height !== undefined && zone.y + zone.height > canvasHeight) {
      errors.push('La zone dépasse la hauteur du canvas');
    }

    // Vérifier la taille minimale
    if (zone.width !== undefined && zone.width < 50) {
      warnings.push('La largeur est très petite (minimum recommandé: 50px)');
    }

    if (zone.height !== undefined && zone.height < 50) {
      warnings.push('La hauteur est très petite (minimum recommandé: 50px)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Détecte les chevauchements entre zones
   */
  detectZoneOverlaps(zones: ProductZone[]): Array<{
    zone1: string;
    zone2: string;
    overlapArea: number;
    overlapPercentage: number;
  }> {
    const overlaps: Array<{
      zone1: string;
      zone2: string;
      overlapArea: number;
      overlapPercentage: number;
    }> = [];

    for (let i = 0; i < zones.length; i++) {
      for (let j = i + 1; j < zones.length; j++) {
        const zone1 = zones[i];
        const zone2 = zones[j];

        const overlap = this.calculateOverlap(zone1, zone2);
        if (overlap.area > 0) {
          const zone1Area = zone1.width * zone1.height;
          const zone2Area = zone2.width * zone2.height;
          const maxArea = Math.max(zone1Area, zone2Area);
          
          overlaps.push({
            zone1: zone1.id,
            zone2: zone2.id,
            overlapArea: overlap.area,
            overlapPercentage: (overlap.area / maxArea) * 100,
          });
        }
      }
    }

    return overlaps;
  }

  /**
   * Calcule la zone de chevauchement entre deux zones
   */
  private calculateOverlap(zone1: ProductZone, zone2: ProductZone): {
    area: number;
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const left = Math.max(zone1.x, zone2.x);
    const right = Math.min(zone1.x + zone1.width, zone2.x + zone2.width);
    const top = Math.max(zone1.y, zone2.y);
    const bottom = Math.min(zone1.y + zone1.height, zone2.y + zone2.height);

    if (left < right && top < bottom) {
      const width = right - left;
      const height = bottom - top;
      return {
        area: width * height,
        x: left,
        y: top,
        width,
        height,
      };
    }

    return { area: 0, x: 0, y: 0, width: 0, height: 0 };
  }

  /**
   * Obtient les statistiques d'usage des zones
   */
  async getZoneUsageStats(
    productId: string,
    period: 'day' | 'week' | 'month' = 'week',
  ): Promise<Record<string, ZoneUsageStats>> {
    const cacheKey = `zone_usage_stats:${productId}:${period}`;
    
    const cached = await this.cache.getSimple(cacheKey);
    if (cached) {
      return cached as Record<string, ZoneUsageStats>;
    }

    try {
      // Calculer la période
      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Récupérer les designs avec options pour cette période
      const designs = await this.prisma.design.findMany({
        where: {
          productId,
          createdAt: {
            gte: startDate,
            lte: now,
          },
        },
        select: {
          optionsJson: true,
          status: true,
        },
      });

      const zones = await this.getZones(productId);

      const accumulators: Record<string, ZoneUsageAccumulator> = zones.reduce(
        (acc, zone) => {
          acc[zone.id] = {
            usageCount: 0,
            successCount: 0,
            optionCounts: new Map<string, number>(),
          };
          return acc;
        },
        {} as Record<string, ZoneUsageAccumulator>,
      );

      for (const design of designs) {
        const options = this.ensureDesignOptions(design.optionsJson);
        const zoneOptionsMap = options.zones ?? {};

        for (const [zoneId, zoneOption] of Object.entries(zoneOptionsMap)) {
          const accumulator = accumulators[zoneId];
          if (!accumulator) continue;

          accumulator.usageCount += 1;

          if (design.status === 'COMPLETED') {
            accumulator.successCount += 1;
          }

          for (const optionKey of Object.keys(zoneOption as Record<string, unknown>)) {
            const currentCount = accumulator.optionCounts.get(optionKey) ?? 0;
            accumulator.optionCounts.set(optionKey, currentCount + 1);
          }
        }
      }

      const stats: Record<string, ZoneUsageStats> = {};

      for (const [zoneId, accumulator] of Object.entries(accumulators)) {
        const successRate = accumulator.usageCount
          ? (accumulator.successCount / accumulator.usageCount) * 100
          : 0;

        const popularOptions = Array.from(accumulator.optionCounts.entries())
          .sort(([, countA], [, countB]) => countB - countA)
          .slice(0, 5)
          .map(([option, count]) => ({ option, count }));

        stats[zoneId] = {
          usageCount: accumulator.usageCount,
          successRate,
          averagePrice: 0,
          popularOptions,
        };
      }

      await this.cache.setSimple(cacheKey, stats, 1800);

      return stats;
    } catch (error) {
      this.logger.error(`Error getting zone usage stats for ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Génère des suggestions d'amélioration pour les zones
   */
  async getZoneImprovementSuggestions(productId: string): Promise<Array<{
    zoneId: string;
    zoneLabel: string;
    suggestion: string;
    priority: 'low' | 'medium' | 'high';
    impact: string;
  }>> {
    try {
      const zones = await this.getZones(productId);
      const usageStats = await this.getZoneUsageStats(productId, 'month');
      const suggestions: Array<{
        zoneId: string;
        zoneLabel: string;
        suggestion: string;
        priority: 'low' | 'medium' | 'high';
        impact: string;
      }> = [];

      for (const zone of zones) {
        const stats = usageStats[zone.id];
        if (!stats) {
          continue;
        }
        
        // Zone peu utilisée
        if (stats.usageCount < 5) {
          suggestions.push({
            zoneId: zone.id,
            zoneLabel: zone.label,
            suggestion: 'Considérez repositionner ou redimensionner cette zone pour améliorer la visibilité',
            priority: 'medium',
            impact: 'Augmentation potentielle de l\'engagement utilisateur',
          });
        }

        // Zone avec faible taux de succès
        if (stats.successRate < 70) {
          suggestions.push({
            zoneId: zone.id,
            zoneLabel: zone.label,
            suggestion: 'Simplifiez les contraintes ou ajoutez des exemples pour guider les utilisateurs',
            priority: 'high',
            impact: 'Amélioration du taux de conversion',
          });
        }

        // Zone avec contraintes trop strictes
        if (zone.constraints?.maxChars && zone.constraints.maxChars < 10) {
          suggestions.push({
            zoneId: zone.id,
            zoneLabel: zone.label,
            suggestion: 'Augmentez la limite de caractères pour permettre plus de créativité',
            priority: 'low',
            impact: 'Meilleure expérience utilisateur',
          });
        }

        // Zone mal positionnée
        if (zone.x < 50 || zone.y < 50) {
          suggestions.push({
            zoneId: zone.id,
            zoneLabel: zone.label,
            suggestion: 'Déplacez la zone vers le centre pour améliorer la visibilité',
            priority: 'low',
            impact: 'Meilleure ergonomie',
          });
        }
      }

      return suggestions;
    } catch (error) {
      this.logger.error(`Error getting zone improvement suggestions for ${productId}:`, error);
      throw error;
    }
  }

  private parseRules(rulesJson: Prisma.JsonValue | null): ProductRules {
    if (!rulesJson || typeof rulesJson !== 'object' || Array.isArray(rulesJson)) {
      return { zones: [] };
    }

    const raw = rulesJson as Partial<ProductRules> & Record<string, unknown>;
    const zones = Array.isArray(raw.zones)
      ? raw.zones.map((zone) => this.ensureProductZone(zone))
      : [];

    return {
      zones,
      compatibilityRules: Array.isArray(raw.compatibilityRules)
        ? raw.compatibilityRules
            .map((rule) => this.ensureCompatibilityRule(rule))
            .filter((rule): rule is CompatibilityRule => rule !== undefined)
        : undefined,
      globalConstraints: raw.globalConstraints,
      pricing: raw.pricing,
      metadata: this.ensureRecord(raw.metadata),
    };
  }

  private serializeRules(rules: ProductRules): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(rules)) as Prisma.InputJsonValue;
  }

  private ensureProductZone(zone: unknown): ProductZone {
    if (!zone || typeof zone !== 'object') {
      return {
        id: this.generateZoneId(),
        label: 'Zone',
        type: 'image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };
    }

    const raw = zone as Partial<ProductZone> & Record<string, unknown>;

    return {
      id: typeof raw.id === 'string' ? raw.id : this.generateZoneId(),
      label: typeof raw.label === 'string' ? raw.label : 'Zone',
      type: this.ensureZoneType(raw.type),
      x: typeof raw.x === 'number' ? raw.x : 0,
      y: typeof raw.y === 'number' ? raw.y : 0,
      width: typeof raw.width === 'number' ? raw.width : 100,
      height: typeof raw.height === 'number' ? raw.height : 100,
      allowedMime: Array.isArray(raw.allowedMime)
        ? raw.allowedMime.filter((mime): mime is string => typeof mime === 'string')
        : undefined,
      maxResolution: this.ensureResolution(raw.maxResolution),
      priceDeltaCents: typeof raw.priceDeltaCents === 'number' ? raw.priceDeltaCents : undefined,
      constraints:
        raw.constraints && typeof raw.constraints === 'object'
          ? (raw.constraints as ProductZone['constraints'])
          : undefined,
      metadata: this.ensureRecord(raw.metadata),
    };
  }

  private ensureZoneType(type: unknown): ProductZone['type'] {
    if (type === 'text' || type === 'color' || type === 'select') {
      return type;
    }
    return 'image';
  }

  private ensureRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    return value as Record<string, unknown>;
  }

  private ensureDesignOptions(data: Prisma.JsonValue | null): DesignOptions {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {};
    }

    const record = data as Record<string, unknown>;

    return {
      zones: this.ensureZoneOptionsRecord(record.zones),
      materials: this.ensureNumberRecord(record.materials),
      finishes: this.ensureNumberRecord(record.finishes),
      quantity: typeof record.quantity === 'number' ? record.quantity : undefined,
      customizations: this.ensureRecord(record.customizations),
    };
  }

  private ensureZoneOptionsRecord(value: unknown): Record<string, DesignZoneOption> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    const entries = Object.entries(value as Record<string, unknown>);
    const result: Record<string, DesignZoneOption> = {};

    for (const [key, zoneOption] of entries) {
      if (zoneOption && typeof zoneOption === 'object') {
        result[key] = zoneOption as DesignZoneOption;
      }
    }

    return result;
  }

  private ensureNumberRecord(value: unknown): Record<string, number> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    const entries = Object.entries(value as Record<string, unknown>);
    const result: Record<string, number> = {};

    for (const [key, val] of entries) {
      if (typeof val === 'number' && Number.isFinite(val)) {
        result[key] = val;
      }
    }

    return result;
  }

  private ensureResolution(value: unknown): { w: number; h: number } | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    const width = record.w;
    const height = record.h;

    if (typeof width === 'number' && Number.isFinite(width) && typeof height === 'number' && Number.isFinite(height)) {
      return { w: width, h: height };
    }

    return undefined;
  }

  private ensureCompatibilityRule(rule: unknown): CompatibilityRule | undefined {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
      return undefined;
    }

    const raw = rule as Partial<CompatibilityRule> & Record<string, unknown>;
    if (!raw.if || typeof raw.if !== 'object' || Array.isArray(raw.if)) {
      return undefined;
    }

    return {
      if: raw.if as CompatibilityRule['if'],
      deny: Array.isArray(raw.deny) ? raw.deny.filter((item): item is string => typeof item === 'string') : undefined,
      allow: Array.isArray(raw.allow) ? raw.allow.filter((item): item is string => typeof item === 'string') : undefined,
      require: Array.isArray(raw.require)
        ? raw.require.filter((item): item is string => typeof item === 'string')
        : undefined,
      priceMultiplier: typeof raw.priceMultiplier === 'number' ? raw.priceMultiplier : undefined,
    };
  }

  private generateZoneId(): string {
    return `zone_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

interface ZoneUsageAccumulator {
  usageCount: number;
  successCount: number;
  optionCounts: Map<string, number>;
}

interface ZoneUsageStats {
  usageCount: number;
  successRate: number;
  averagePrice: number;
  popularOptions: Array<{ option: string; count: number }>;
}


