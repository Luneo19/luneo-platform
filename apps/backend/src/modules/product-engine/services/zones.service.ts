import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { 
  ProductZone, 
  ProductRules,
  DesignOptions
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
        throw new NotFoundException(`Product ${productId} not found`);
      }

      const rules = (product.rulesJson as unknown as ProductRules | null) ?? { zones: [] };

      const zoneId = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newZone: ProductZone = {
        ...zone,
        id: zoneId,
      };

      rules.zones.push(newZone);

      await this.prisma.product.update({
        where: { id: productId },
        data: { rulesJson: rules as unknown as Prisma.InputJsonValue },
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
        throw new NotFoundException(`Product ${productId} not found`);
      }

      const rules = (product.rulesJson as unknown as ProductRules | null) ?? { zones: [] };
      const zoneIndex = rules.zones.findIndex(z => z.id === zoneId);

      if (zoneIndex === -1) {
        throw new NotFoundException(`Zone ${zoneId} not found`);
      }

      // Mettre à jour la zone
      rules.zones[zoneIndex] = {
        ...rules.zones[zoneIndex],
        ...updates,
        id: zoneId, // Préserver l'ID
      };

      // Sauvegarder les règles mises à jour
      await this.prisma.product.update({
        where: { id: productId },
        data: { rulesJson: rules as unknown as Prisma.InputJsonValue },
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
        throw new NotFoundException(`Product ${productId} not found`);
      }

      const rules = (product.rulesJson as unknown as ProductRules | null) ?? { zones: [] };
      const zoneIndex = rules.zones.findIndex(z => z.id === zoneId);

      if (zoneIndex === -1) {
        throw new NotFoundException(`Zone ${zoneId} not found`);
      }

      rules.zones.splice(zoneIndex, 1);

      await this.prisma.product.update({
        where: { id: productId },
        data: { rulesJson: rules as unknown as Prisma.InputJsonValue },
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
        throw new NotFoundException(`Product ${productId} not found`);
      }

      const rules = (product.rulesJson as unknown as ProductRules | null) ?? { zones: [] };
      const originalZone = rules.zones.find(z => z.id === zoneId);

      if (!originalZone) {
        throw new NotFoundException(`Zone ${zoneId} not found`);
      }

      // Créer une copie avec un nouvel ID
      const newZoneId = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        data: { rulesJson: rules as unknown as Prisma.InputJsonValue },
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

      if (!product || !product.rulesJson) {
        return [];
      }

      const rules = product.rulesJson as unknown as ProductRules | null;
      return rules?.zones ?? [];
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
        throw new NotFoundException(`Product ${productId} not found`);
      }

      const rules = (product.rulesJson as unknown as ProductRules | null) ?? { zones: [] };

      // Réorganiser les zones selon l'ordre fourni
      const reorderedZones: ProductZone[] = [];
      
      for (const zoneId of zoneIds) {
        const zone = rules.zones.find(z => z.id === zoneId);
        if (zone) {
          reorderedZones.push(zone);
        }
      }

      // Ajouter les zones non spécifiées à la fin
      for (const zone of rules.zones) {
        if (!zoneIds.includes(zone.id)) {
          reorderedZones.push(zone);
        }
      }

      rules.zones = reorderedZones;

      await this.prisma.product.update({
        where: { id: productId },
        data: { rulesJson: rules as unknown as Prisma.InputJsonValue },
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
  async getZoneUsageStats(productId: string, period: 'day' | 'week' | 'month' = 'week'): Promise<Record<string, {
    usageCount: number;
    successRate: number;
    averagePrice: number;
    popularOptions: Array<{ option: string; count: number }>;
  }>> {
    const cacheKey = `zone_usage_stats:${productId}:${period}`;
    
    const cached = await this.cache.getSimple<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Record<string, {
        usageCount: number;
        successRate: number;
        averagePrice: number;
        popularOptions: Array<{ option: string; count: number }>;
      }>;
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
          options: true,
          status: true,
        },
      });

      const zones = await this.getZones(productId);
      interface ZoneStat {
        usageCount: number;
        successRate: number;
        averagePrice: number;
        popularOptions: Array<{ option: string; count: number }>;
      }
      const stats: Record<string, ZoneStat> = {};

      // Initialiser les stats pour chaque zone
      for (const zone of zones) {
        stats[zone.id] = {
          usageCount: 0,
          successRate: 0,
          averagePrice: 0,
          popularOptions: [],
        };
      }

      // Analyser l'usage des zones
      for (const design of designs) {
        const options = design.options as unknown as DesignOptions | null;
        if (!options?.zones) continue;

        for (const [zoneId, zoneOptions] of Object.entries(options.zones)) {
          if (stats[zoneId]) {
            stats[zoneId].usageCount++;

            if (design.status === 'COMPLETED') {
              stats[zoneId].successRate++;
            }

            const zoneOpts = zoneOptions as unknown as Record<string, unknown>;
            for (const optionKey of Object.keys(zoneOpts)) {
              const existingOption = stats[zoneId].popularOptions.find(
                (opt) => opt.option === optionKey
              );
              
              if (existingOption) {
                existingOption.count++;
              } else {
                stats[zoneId].popularOptions.push({
                  option: optionKey,
                  count: 1,
                });
              }
            }
          }
        }
      }

      // Calculer les taux de succès
      for (const zoneId of Object.keys(stats)) {
        if (stats[zoneId].usageCount > 0) {
          stats[zoneId].successRate = (stats[zoneId].successRate / stats[zoneId].usageCount) * 100;
        }
        
        // Trier les options populaires
        stats[zoneId].popularOptions.sort((a, b) => b.count - a.count);
        stats[zoneId].popularOptions = stats[zoneId].popularOptions.slice(0, 5); // Top 5
      }

      // Mettre en cache pour 30 minutes
      await this.cache.setSimple(cacheKey, JSON.stringify(stats), 1800);
      
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
        
        // Zone peu utilisée
        if (stats && stats.usageCount < 5) {
          suggestions.push({
            zoneId: zone.id,
            zoneLabel: zone.label,
            suggestion: 'Considérez repositionner ou redimensionner cette zone pour améliorer la visibilité',
            priority: 'medium',
            impact: 'Augmentation potentielle de l\'engagement utilisateur',
          });
        }

        // Zone avec faible taux de succès
        if (stats && stats.successRate < 70) {
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
}


