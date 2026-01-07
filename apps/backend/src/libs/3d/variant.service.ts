import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

export interface MaterialVariant {
  materialId: string;
  name: string;
  type: 'metal' | 'stone' | 'finish';
  properties: {
    color?: string;
    roughness?: number;
    metalness?: number;
    textureUrl?: string;
    normalMapUrl?: string;
  };
}

export interface VariantCache {
  baseModelUrl: string;
  variants: Record<string, string>; // materialId -> variantUrl
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class VariantService {
  private readonly logger = new Logger(VariantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Génère un variant (matériau ou pierre) sans re-export complet
   * Utilise le cache si disponible
   */
  async generateVariant(
    designId: string,
    baseModelUrl: string,
    material: MaterialVariant,
  ): Promise<string> {
    const cacheKey = `variant:${designId}:${material.materialId}`;

    // Vérifier le cache
    const cached = await this.cache.getSimple<VariantCache>(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      this.logger.debug(`Variant cache hit for ${material.materialId}`);
      return cached.variants[material.materialId] || baseModelUrl;
    }

    try {
      // Générer le variant
      const variantUrl = await this.applyMaterialToModel(baseModelUrl, material);

      // Mettre en cache
      const variantCache: VariantCache = {
        baseModelUrl,
        variants: {
          [material.materialId]: variantUrl,
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      };

      await this.cache.setSimple(cacheKey, JSON.stringify(variantCache), 7 * 24 * 60 * 60);

      // Sauvegarder dans Asset
      await this.prisma.asset.create({
        data: {
          designId,
          url: variantUrl,
          type: 'model',
          format: 'glb',
          size: 0, // Will be updated if available
          metadata: {
            variant: true,
            materialId: material.materialId,
            materialType: material.type,
          } as any,
        },
      });

      return variantUrl;
    } catch (error) {
      this.logger.error(`Failed to generate variant for ${material.materialId}:`, error);
      // Fallback: retourner le modèle de base
      return baseModelUrl;
    }
  }

  /**
   * Applique un matériau à un modèle 3D
   */
  private async applyMaterialToModel(
    modelUrl: string,
    material: MaterialVariant,
  ): Promise<string> {
    // TODO: Implémenter application matériau réel
    // Options:
    // 1. Utiliser gltf-transform (Node.js)
    // 2. Utiliser Three.js pour modifier materials
    // 3. Utiliser Blender headless

    this.logger.debug(`Applying material ${material.materialId} to model`, {
      materialType: material.type,
      properties: material.properties,
    });

    // Simulation: retourner URL modifiée
    const variantUrl = `${modelUrl}_${material.materialId}.glb`;
    return variantUrl;
  }

  /**
   * Génère plusieurs variants en batch
   */
  async generateVariantsBatch(
    designId: string,
    baseModelUrl: string,
    materials: MaterialVariant[],
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    await Promise.all(
      materials.map(async (material) => {
        try {
          const variantUrl = await this.generateVariant(designId, baseModelUrl, material);
          results[material.materialId] = variantUrl;
        } catch (error) {
          this.logger.error(`Failed to generate variant ${material.materialId}:`, error);
        }
      }),
    );

    return results;
  }

  /**
   * Récupère un variant depuis le cache ou génère
   */
  async getVariant(
    designId: string,
    materialId: string,
    baseModelUrl?: string,
  ): Promise<string | null> {
    // Chercher dans les assets
    const asset = await this.prisma.asset.findFirst({
      where: {
        designId,
        type: 'model',
        metadata: {
          path: ['materialId'],
          equals: materialId,
        } as any,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (asset) {
      return asset.url;
    }

    // Si baseModelUrl fourni, générer
    if (baseModelUrl) {
      // Récupérer le matériau depuis la config
      // Pour l'instant, retourner null
      return null;
    }

    return null;
  }

  /**
   * Nettoie les anciens variants (retention policy)
   */
  async cleanupOldVariants(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.asset.deleteMany({
      where: {
        type: 'model',
        metadata: {
          path: ['variant'],
          equals: true,
        } as any,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old variants`);
    return result.count;
  }
}
































