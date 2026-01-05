import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Génère tous les niveaux LOD pour un modèle 3D
   */
  async generateLODs(
    designId: string,
    sourceModelUrl: string,
  ): Promise<Record<LODLevel, string>> {
    const results: Record<LODLevel, string> = {} as any;

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
   */
  private async generateLOD(
    sourceModelUrl: string,
    config: LODConfig,
  ): Promise<string> {
    // TODO: Implémenter génération LOD réelle
    // Options:
    // 1. Utiliser gltf-pipeline (Node.js)
    // 2. Utiliser Blender headless (Python)
    // 3. Utiliser service externe (ModelOptimizer, etc.)

    // Pour l'instant, simulation
    this.logger.debug(`Generating LOD ${config.level}`, {
      maxPolygons: config.maxPolygons,
      compression: config.compression,
    });

    // Simuler génération
    const lodUrl = `${sourceModelUrl}_${config.level}.${config.format}`;
    return lodUrl;
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
        } as any,
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
        } as any,
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






























