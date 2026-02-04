import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { firstValueFrom } from 'rxjs';

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
  private readonly model3dServiceUrl: string;

  // Définitions de matériaux par défaut pour les bijoux
  private readonly MATERIAL_PRESETS: Record<string, {
    color: string;
    metalness: number;
    roughness: number;
    ior?: number;
  }> = {
    gold: { color: '#FFD700', metalness: 1.0, roughness: 0.3, ior: 0.47 },
    'rose-gold': { color: '#E8B4B8', metalness: 1.0, roughness: 0.3, ior: 0.47 },
    'white-gold': { color: '#FFFDD0', metalness: 1.0, roughness: 0.25, ior: 0.47 },
    silver: { color: '#C0C0C0', metalness: 1.0, roughness: 0.2, ior: 0.18 },
    platinum: { color: '#E5E4E2', metalness: 1.0, roughness: 0.15, ior: 2.33 },
    diamond: { color: '#FFFFFF', metalness: 0.0, roughness: 0.0, ior: 2.42 },
    ruby: { color: '#E0115F', metalness: 0.0, roughness: 0.1, ior: 1.77 },
    sapphire: { color: '#0F52BA', metalness: 0.0, roughness: 0.1, ior: 1.77 },
    emerald: { color: '#50C878', metalness: 0.0, roughness: 0.15, ior: 1.58 },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly cache: SmartCacheService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.model3dServiceUrl = this.configService.get<string>('RENDER_3D_SERVICE_URL') || '';
  }

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
   * Utilise un service externe si disponible, sinon génère metadata pour application côté client
   */
  private async applyMaterialToModel(
    modelUrl: string,
    material: MaterialVariant,
  ): Promise<string> {
    this.logger.debug(`Applying material ${material.materialId} to model`, {
      materialType: material.type,
      properties: material.properties,
    });

    // Enrichir les propriétés du matériau avec les presets si nécessaire
    const enrichedMaterial = this.enrichMaterialProperties(material);

    // Option 1: Service externe de transformation 3D
    if (this.model3dServiceUrl) {
      try {
        const response = await firstValueFrom(
          this.httpService.post<{ url?: string; error?: string }>(
            `${this.model3dServiceUrl.replace(/\/$/, '')}/transform/material`,
            {
              modelUrl,
              material: enrichedMaterial,
            },
            { timeout: 60000 },
          ),
        );

        if (response.data?.url) {
          this.logger.log(`Material applied via external service: ${enrichedMaterial.materialId}`);
          return response.data.url;
        }
      } catch (err) {
        this.logger.warn(`External material service failed: ${err}`);
      }
    }

    // Option 2: Générer un fichier de configuration de matériau
    // Ce fichier JSON peut être utilisé côté client pour appliquer le matériau dynamiquement
    const materialConfig = {
      baseModel: modelUrl,
      material: enrichedMaterial,
      appliedAt: new Date().toISOString(),
    };

    // Upload la configuration du matériau
    const configFilename = `variants/${material.materialId}_${Date.now()}.json`;
    const configUrl = await this.storageService.uploadBuffer(
      Buffer.from(JSON.stringify(materialConfig, null, 2)),
      configFilename,
      { contentType: 'application/json' },
    ) as string;

    // Retourner l'URL du modèle avec un paramètre de matériau
    // Le viewer 3D côté client peut charger ce JSON et appliquer le matériau
    const variantUrl = `${modelUrl}?materialConfig=${encodeURIComponent(configUrl)}`;
    
    this.logger.log(`Material config generated for ${enrichedMaterial.materialId}`);
    return variantUrl;
  }

  /**
   * Enrichit les propriétés du matériau avec les presets par défaut
   */
  private enrichMaterialProperties(material: MaterialVariant): MaterialVariant {
    const preset = this.MATERIAL_PRESETS[material.name.toLowerCase()] ||
                   this.MATERIAL_PRESETS[material.materialId.toLowerCase()];

    if (preset) {
      return {
        ...material,
        properties: {
          color: preset.color,
          metalness: preset.metalness,
          roughness: preset.roughness,
          ...material.properties, // Les propriétés explicites écrasent les presets
        },
      };
    }

    // Si pas de preset, utiliser des valeurs par défaut selon le type
    const defaultsByType: Record<string, { metalness: number; roughness: number }> = {
      metal: { metalness: 1.0, roughness: 0.3 },
      stone: { metalness: 0.0, roughness: 0.1 },
      finish: { metalness: 0.5, roughness: 0.5 },
    };

    const defaults = defaultsByType[material.type] || { metalness: 0.5, roughness: 0.5 };

    return {
      ...material,
      properties: {
        ...defaults,
        ...material.properties,
      },
    };
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

































