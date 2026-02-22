import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import { StorageService } from '@/libs/storage/storage.service';
import { firstValueFrom } from 'rxjs';

export type LODLevel = 'mobile' | 'desktop' | 'ar' | 'ultra';

export interface LODConfig {
  level: LODLevel;
  maxPolygons: number;
  maxTextureSize: number;
  compression: 'none' | 'draco' | 'ktx2';
  format: 'gltf' | 'glb';
}

@Injectable()
export class LODService {
  private readonly logger = new Logger(LODService.name);

  // Configuration LOD par niveau
  private readonly LOD_CONFIGS: Record<LODLevel, LODConfig> = {
    mobile: {
      level: 'mobile',
      maxPolygons: 5000,
      maxTextureSize: 512,
      compression: 'draco',
      format: 'glb',
    },
    desktop: {
      level: 'desktop',
      maxPolygons: 20000,
      maxTextureSize: 1024,
      compression: 'draco',
      format: 'glb',
    },
    ar: {
      level: 'ar',
      maxPolygons: 10000,
      maxTextureSize: 512,
      compression: 'draco',
      format: 'glb', // ou usdz pour iOS
    },
    ultra: {
      level: 'ultra',
      maxPolygons: 100000,
      maxTextureSize: 2048,
      compression: 'none',
      format: 'gltf',
    },
  };

  private readonly model3dServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.model3dServiceUrl = this.configService.get<string>('RENDER_3D_SERVICE_URL') || '';
  }

  /**
   * Génère tous les niveaux LOD pour un modèle 3D
   */
  async generateLODs(
    designId: string,
    sourceModelUrl: string,
  ): Promise<Record<LODLevel, string>> {
    const results = {} as Record<LODLevel, string>;

    this.logger.log(`Generating LODs for design ${designId}`);

    for (const [level, config] of Object.entries(this.LOD_CONFIGS)) {
      try {
        const lodUrl = await this.generateLOD(sourceModelUrl, config);
        results[level as LODLevel] = lodUrl;

        // Sauvegarder dans DB
        await this.saveLODResult(designId, level as LODLevel, lodUrl, config);
      } catch (error) {
        this.logger.error(`Failed to generate LOD ${level} for design ${designId}:`, error);
        // Continuer avec les autres niveaux
      }
    }

    return results;
  }

  /**
   * Génère un niveau LOD spécifique
   * Utilise un service externe si disponible, sinon retourne le modèle source avec metadata
   */
  private async generateLOD(
    sourceModelUrl: string,
    config: LODConfig,
  ): Promise<string> {
    this.logger.debug(`Generating LOD ${config.level}`, {
      maxPolygons: config.maxPolygons,
      compression: config.compression,
    });

    // Option 1: Service externe de génération LOD
    if (this.model3dServiceUrl) {
      try {
        const response = await firstValueFrom(
          this.httpService.post<{ url?: string; stats?: { polygons: number; size: number } }>(
            `${this.model3dServiceUrl.replace(/\/$/, '')}/transform/lod`,
            {
              modelUrl: sourceModelUrl,
              config: {
                level: config.level,
                maxPolygons: config.maxPolygons,
                maxTextureSize: config.maxTextureSize,
                compression: config.compression,
                format: config.format,
              },
            },
            { timeout: 120000 }, // 2 minutes pour LOD complexe
          ),
        );

        if (response.data?.url) {
          this.logger.log(`LOD ${config.level} generated via external service`, {
            stats: response.data.stats,
          });
          return response.data.url;
        }
      } catch (err) {
        this.logger.warn(`External LOD service failed for ${config.level}: ${err}`);
      }
    }

    // Option 2: Générer un fichier de configuration LOD
    // Les viewers modernes peuvent appliquer des optimisations côté client
    const lodConfig = {
      sourceModel: sourceModelUrl,
      level: config.level,
      constraints: {
        maxPolygons: config.maxPolygons,
        maxTextureSize: config.maxTextureSize,
        compression: config.compression,
      },
      hints: this.getLODHints(config.level),
      generatedAt: new Date().toISOString(),
    };

    const configFilename = `lod/${config.level}_${Date.now()}.json`;
    const configUrl = await this.storageService.uploadBuffer(
      Buffer.from(JSON.stringify(lodConfig, null, 2)),
      configFilename,
      { contentType: 'application/json' },
    ) as string;

    // Retourner l'URL du modèle avec un paramètre de configuration LOD
    const lodUrl = `${sourceModelUrl}?lodConfig=${encodeURIComponent(configUrl)}&level=${config.level}`;
    
    this.logger.log(`LOD config generated for ${config.level}`);
    return lodUrl;
  }

  /**
   * Fournit des hints d'optimisation selon le niveau LOD
   */
  private getLODHints(level: LODLevel): Record<string, unknown> {
    const hints: Record<LODLevel, Record<string, unknown>> = {
      mobile: {
        simplifyMeshes: true,
        mergeGeometries: true,
        removeDuplicates: true,
        reduceTextureSize: true,
        targetFPS: 60,
        memoryBudgetMB: 128,
      },
      desktop: {
        simplifyMeshes: true,
        mergeGeometries: true,
        removeDuplicates: true,
        targetFPS: 60,
        memoryBudgetMB: 512,
      },
      ar: {
        simplifyMeshes: true,
        mergeGeometries: true,
        removeDuplicates: true,
        reduceTextureSize: true,
        optimizeForAR: true,
        targetFPS: 30,
        memoryBudgetMB: 256,
      },
      ultra: {
        preserveDetails: true,
        targetFPS: 30,
        memoryBudgetMB: 2048,
      },
    };

    return hints[level] || hints.desktop;
  }

  /**
   * Sauvegarde le résultat LOD
   */
  private async saveLODResult(
    designId: string,
    level: LODLevel,
    url: string,
    config: LODConfig,
  ): Promise<void> {
    // Sauvegarder dans Asset avec metadata LOD
    await this.prisma.asset.create({
      data: {
        designId,
        url,
        type: 'model',
        format: config.format,
        size: 0, // Will be updated if available
        metadata: {
          lod: level,
          maxPolygons: config.maxPolygons,
          compression: config.compression,
        } as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Récupère l'URL LOD appropriée selon le device
   */
  async getLODUrl(designId: string, deviceType: 'mobile' | 'desktop'): Promise<string | null> {
    const level: LODLevel = deviceType === 'mobile' ? 'mobile' : 'desktop';

    const asset = await this.prisma.asset.findFirst({
      where: {
        designId,
        type: 'model',
        metadata: {
          path: ['lod'],
          equals: level,
        } as Prisma.JsonFilter,
      },
      orderBy: { createdAt: 'desc' },
    });

    return asset?.url || null;
  }

  /**
   * Récupère la configuration LOD pour un niveau
   */
  getLODConfig(level: LODLevel): LODConfig {
    return this.LOD_CONFIGS[level];
  }
}

































