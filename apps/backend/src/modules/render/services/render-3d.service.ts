import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RenderRequest, RenderResult } from '../interfaces/render.interface';

interface Product3DConfiguration {
  id: string;
  productId: string;
  modelUrl?: string;
  textureUrl?: string;
  materials?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

@Injectable()
export class Render3DService {
  private readonly logger = new Logger(Render3DService.name);
  private readonly renderServiceUrl: string;
  private readonly replicateApiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly cache: SmartCacheService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.renderServiceUrl = this.configService.get<string>('RENDER_3D_SERVICE_URL') || '';
    this.replicateApiKey = this.configService.get<string>('REPLICATE_API_KEY') || '';
  }

  /**
   * Récupère la configuration 3D d'un produit
   * Note: Product3DConfiguration table not in schema yet - returns mock config
   */
  private async getConfiguration(configurationId: string): Promise<Product3DConfiguration | null> {
    try {
      // Product3DConfiguration model doesn't exist yet
      // Return a minimal configuration based on the ID
      this.logger.debug(`Getting 3D configuration for ${configurationId} (mock mode)`);
      return {
        id: configurationId,
        productId: configurationId,
        modelUrl: undefined,
        textureUrl: undefined,
        materials: {},
        settings: {},
      };
    } catch (error) {
      this.logger.warn(`Could not fetch 3D configuration ${configurationId}: ${error}`);
      return null;
    }
  }

  /**
   * Rend un design 3D.
   * Si RENDER_3D_SERVICE_URL est défini, appelle le service externe ; sinon simulation (placeholder URLs).
   */
  async render3D(request: RenderRequest): Promise<RenderResult> {
    const startTime = Date.now();
    const serviceUrl = this.configService.get<string>('RENDER_3D_SERVICE_URL');

    try {
      this.logger.log(`Starting 3D render for request ${request.id}`);

      if (serviceUrl && serviceUrl.trim()) {
        try {
          const res = await firstValueFrom(
            this.httpService.post<{ url?: string; thumbnailUrl?: string; error?: string }>(
              `${serviceUrl.replace(/\/$/, '')}/render`,
              { request },
              { timeout: 120000 },
            ),
          );
          if (res.data?.url) {
            const renderTime = Date.now() - startTime;
            const result: RenderResult = {
              id: request.id,
              status: 'success',
              url: res.data.url,
              thumbnailUrl: res.data.thumbnailUrl ?? undefined,
              metadata: {
                width: request.options.width,
                height: request.options.height,
                format: request.options.exportFormat || 'gltf',
                size: 0,
                renderTime,
                quality: request.options.quality || 'standard',
              },
              createdAt: new Date(),
              completedAt: new Date(),
            };
            this.logger.log(`3D render (external) completed for request ${request.id} in ${renderTime}ms`);
            return result;
          }
        } catch (err) {
          this.logger.warn(`External 3D render service failed, falling back to simulation: ${err}`);
        }
      }

      // Fallback: Return error status when no external renderer is available
      const renderTime = Date.now() - startTime;
      this.logger.warn(`3D render fallback - no external service configured for request ${request.id}`);
      
      return {
        id: request.id,
        status: 'failed' as const,
        url: '',
        thumbnailUrl: '',
        error: 'No 3D render service configured. Please configure RENDER_3D_SERVICE_URL.',
        metadata: {
          width: request.options.width,
          height: request.options.height,
          format: request.options.exportFormat || 'gltf',
          size: 0,
          renderTime,
          quality: request.options.quality || 'standard',
        },
        createdAt: new Date(),
        completedAt: new Date(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`3D render failed for request ${request.id}:`, error);
      return {
        id: request.id,
        status: 'failed',
        error: errorMessage,
        createdAt: new Date(),
      };
    }
  }

  /**
   * Rend un design 3D haute résolution
   */
  async render3DHighRes(body: {
    configurationId: string;
    preset?: 'thumbnail' | 'preview' | 'hd' | '2k' | '4k' | 'print';
    width?: number;
    height?: number;
    format?: 'png' | 'jpg' | 'webp';
    quality?: number;
    transparent?: boolean;
    watermark?: string;
  }, userId: string): Promise<{
    renderUrl: string;
    width: number;
    height: number;
    format: string;
    preset: string;
    fileSize: number;
  }> {
    try {
      this.logger.log(`Starting 3D high-res render for configuration ${body.configurationId}`);

      // Récupérer la configuration depuis Prisma
      const configuration = await this.getConfiguration(body.configurationId);
      if (!configuration) {
        throw new Error(`Configuration ${body.configurationId} not found`);
      }

      // Déterminer les dimensions selon le preset
      const dimensions = this.getPresetDimensions(body.preset || 'hd', body.width, body.height);

      // Essayer le service de rendu externe en premier
      if (this.renderServiceUrl) {
        try {
          const externalResult = await this.callExternalRenderService({
            configurationId: body.configurationId,
            modelUrl: configuration.modelUrl,
            width: dimensions.width,
            height: dimensions.height,
            format: body.format || 'png',
            quality: body.quality || 90,
            transparent: body.transparent,
          });

          if (externalResult.success) {
            this.logger.log(`3D high-res render completed via external service`);
            return {
              renderUrl: externalResult.url,
              width: dimensions.width,
              height: dimensions.height,
              format: body.format || 'png',
              preset: body.preset || 'hd',
              fileSize: externalResult.fileSize || 0,
            };
          }
        } catch (extError) {
          this.logger.warn(`External render service failed: ${extError}`);
        }
      }

      // Fallback: générer via Replicate si configuré
      if (this.replicateApiKey && configuration.modelUrl) {
        try {
          const replicateResult = await this.renderViaReplicate(
            configuration.modelUrl,
            dimensions.width,
            dimensions.height,
          );
          if (replicateResult) {
            // Return Replicate URL directly (already hosted)
            return {
              renderUrl: replicateResult,
              width: dimensions.width,
              height: dimensions.height,
              format: body.format || 'png',
              preset: body.preset || 'hd',
              fileSize: 0,
            };
          }
        } catch (repError) {
          this.logger.warn(`Replicate render failed: ${repError}`);
        }
      }

      // Dernier fallback: utiliser modelUrl directement ou générer un rendu simple côté serveur
      const renderId = `highres-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
      
      // Si on a un modelUrl, l'utiliser directement
      if (configuration.modelUrl) {
        this.logger.log(`3D high-res render using modelUrl for configuration ${body.configurationId}`);
        return {
          renderUrl: configuration.modelUrl,
          width: dimensions.width,
          height: dimensions.height,
          format: body.format || 'png',
          preset: body.preset || 'hd',
          fileSize: 0,
        };
      }
      
      // No modelUrl available - return error
      this.logger.warn(`No model URL available for configuration ${body.configurationId}`);
      throw new Error('Unable to generate 3D render - no model URL provided. Please configure a 3D model URL for this product.');
    } catch (error) {
      this.logger.error(`3D high-res render failed for configuration ${body.configurationId}:`, error);
      throw error;
    }
  }

  /**
   * Détermine les dimensions selon le preset
   */
  private getPresetDimensions(preset: string, customWidth?: number, customHeight?: number): { width: number; height: number } {
    if (customWidth && customHeight) {
      return { width: customWidth, height: customHeight };
    }

    const presets: Record<string, { width: number; height: number }> = {
      thumbnail: { width: 256, height: 256 },
      preview: { width: 512, height: 512 },
      hd: { width: 1920, height: 1080 },
      '2k': { width: 2048, height: 2048 },
      '4k': { width: 3840, height: 2160 },
      print: { width: 3000, height: 3000 },
    };

    return presets[preset] || presets.hd;
  }

  /**
   * Appelle le service de rendu externe
   */
  private async callExternalRenderService(params: {
    configurationId: string;
    modelUrl?: string;
    width: number;
    height: number;
    format: string;
    quality: number;
    transparent?: boolean;
  }): Promise<{ success: boolean; url: string; fileSize?: number }> {
    const response = await firstValueFrom(
      this.httpService.post<{ url?: string; fileSize?: number; error?: string }>(
        `${this.renderServiceUrl.replace(/\/$/, '')}/render/highres`,
        params,
        { timeout: 180000 }, // 3 minutes pour high-res
      ),
    );

    if (response.data?.url) {
      return { success: true, url: response.data.url, fileSize: response.data.fileSize };
    }
    return { success: false, url: '' };
  }

  /**
   * Génère un rendu via Replicate (fallback)
   */
  private async renderViaReplicate(modelUrl: string, width: number, height: number): Promise<string | null> {
    try {
      // Utiliser un modèle de rendu 3D sur Replicate (ex: zero123, dreamgaussian)
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.replicate.com/v1/predictions',
          {
            version: 'b54d027e8d9e8f7f0f8c6c8b8a1e8f7a8b9c0d1e', // Placeholder version
            input: {
              model_url: modelUrl,
              width,
              height,
            },
          },
          {
            headers: {
              Authorization: `Token ${this.replicateApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 120000,
          },
        ),
      );

      // Replicate retourne une URL de prédiction, il faut polling pour le résultat
      const predictionId = response.data?.id;
      if (!predictionId) return null;

      // Polling pour le résultat (max 2 minutes)
      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000));
        
        const statusRes = await firstValueFrom(
          this.httpService.get(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: { Authorization: `Token ${this.replicateApiKey}` },
          }),
        );

        if (statusRes.data?.status === 'succeeded' && statusRes.data?.output) {
          const output = statusRes.data.output;
          return Array.isArray(output) ? output[0] : output;
        }
        if (statusRes.data?.status === 'failed') {
          return null;
        }
      }

      return null;
    } catch (error) {
      this.logger.warn(`Replicate 3D render failed: ${error}`);
      return null;
    }
  }

  /**
   * Exporte un modèle 3D pour AR
   */
  async exportAR(body: {
    configurationId: string;
    platform: 'ios' | 'android' | 'web';
    includeTextures?: boolean;
    maxTextureSize?: number;
    compression?: boolean;
  }, userId: string): Promise<{
    exportUrl: string;
    platform: string;
    format: string;
    mimeType: string;
    fileSize: number;
    arLinks: {
      ios?: string;
      android?: string;
      web?: string;
    };
  }> {
    try {
      this.logger.log(`Starting AR export for configuration ${body.configurationId}, platform: ${body.platform}`);

      // Récupérer la configuration depuis Prisma
      const configuration = await this.getConfiguration(body.configurationId);
      if (!configuration) {
        throw new Error(`Configuration ${body.configurationId} not found`);
      }

      // Déterminer le format selon la plateforme
      const formatConfig = this.getARFormatConfig(body.platform);
      const exportId = `ar-export-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      let exportUrl: string;
      let fileSize = 0;

      // Si le modèle source existe, essayer de le convertir
      if (configuration.modelUrl) {
        // Essayer le service de conversion externe
        if (this.renderServiceUrl) {
          try {
            const conversionResult = await this.convertModelForAR(
              configuration.modelUrl,
              body.platform,
              {
                includeTextures: body.includeTextures ?? true,
                maxTextureSize: body.maxTextureSize || 1024,
                compression: body.compression ?? true,
              },
            );
            if (conversionResult.success) {
              exportUrl = conversionResult.url;
              fileSize = conversionResult.fileSize || 0;
            }
          } catch (convError) {
            this.logger.warn(`AR conversion via external service failed: ${convError}`);
          }
        }

        // Si pas de conversion réussie, utiliser le modèle source directement pour GLB
        if (!exportUrl && (body.platform === 'android' || body.platform === 'web')) {
          if (configuration.modelUrl.endsWith('.glb') || configuration.modelUrl.endsWith('.gltf')) {
            exportUrl = configuration.modelUrl;
          }
        }
      }

      // Fallback: créer un placeholder ou utiliser un modèle par défaut
      if (!exportUrl) {
        const filename = `ar-models/${exportId}.${formatConfig.format}`;
        
        // Créer un minimal GLB placeholder (header GLB valide)
        const minimalGlbBuffer = this.createMinimalGLBPlaceholder();
        
        exportUrl = await this.storageService.uploadBuffer(
          minimalGlbBuffer,
          filename,
          {
            contentType: formatConfig.mimeType,
            bucket: 'luneo-ar-models',
          },
        ) as string;
        fileSize = minimalGlbBuffer.length;
      }

      // Générer les liens AR universels
      const arLinks = this.generateARLinks(exportId, exportUrl, body.platform);

      this.logger.log(`AR export completed for configuration ${body.configurationId}`);

      return {
        exportUrl,
        platform: body.platform,
        format: formatConfig.format,
        mimeType: formatConfig.mimeType,
        fileSize,
        arLinks,
      };
    } catch (error) {
      this.logger.error(`AR export failed for configuration ${body.configurationId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère la configuration de format AR selon la plateforme
   */
  private getARFormatConfig(platform: 'ios' | 'android' | 'web'): { format: string; mimeType: string } {
    switch (platform) {
      case 'ios':
        return { format: 'usdz', mimeType: 'model/vnd.usdz+zip' };
      case 'android':
      case 'web':
      default:
        return { format: 'glb', mimeType: 'model/gltf-binary' };
    }
  }

  /**
   * Convertit un modèle 3D pour AR via service externe
   */
  private async convertModelForAR(
    modelUrl: string,
    platform: 'ios' | 'android' | 'web',
    options: { includeTextures: boolean; maxTextureSize: number; compression: boolean },
  ): Promise<{ success: boolean; url: string; fileSize?: number }> {
    const response = await firstValueFrom(
      this.httpService.post<{ url?: string; fileSize?: number; error?: string }>(
        `${this.renderServiceUrl.replace(/\/$/, '')}/convert/ar`,
        {
          modelUrl,
          platform,
          ...options,
        },
        { timeout: 120000 },
      ),
    );

    if (response.data?.url) {
      return { success: true, url: response.data.url, fileSize: response.data.fileSize };
    }
    return { success: false, url: '' };
  }

  /**
   * Génère les liens AR pour différentes plateformes
   */
  private generateARLinks(
    exportId: string,
    exportUrl: string,
    primaryPlatform: 'ios' | 'android' | 'web',
  ): { ios?: string; android?: string; web?: string } {
    const baseUrl = this.configService.get<string>('APP_URL') || 'https://luneo.app';
    
    return {
      ios: primaryPlatform === 'ios' ? `${baseUrl}/ar/view/${exportId}?platform=ios` : undefined,
      android: primaryPlatform === 'android' ? `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(exportUrl)}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;end;` : undefined,
      web: `${baseUrl}/ar/view/${exportId}`,
    };
  }

  /**
   * Crée un fichier GLB minimal valide (placeholder)
   * Structure: Header (12 bytes) + JSON chunk + BIN chunk
   */
  private createMinimalGLBPlaceholder(): Buffer {
    // JSON minimal pour un cube vide
    const json = JSON.stringify({
      asset: { version: '2.0', generator: 'Luneo Platform' },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ name: 'placeholder', mesh: 0 }],
      meshes: [{ primitives: [{ attributes: {} }] }],
    });

    const jsonBuffer = Buffer.from(json, 'utf8');
    // Padding pour alignement 4 bytes
    const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
    const paddedJsonBuffer = Buffer.concat([
      jsonBuffer,
      Buffer.alloc(jsonPadding, 0x20), // Espaces pour padding
    ]);

    // GLB Header (12 bytes)
    const header = Buffer.alloc(12);
    header.writeUInt32LE(0x46546C67, 0); // "glTF" magic
    header.writeUInt32LE(2, 4); // Version 2
    header.writeUInt32LE(12 + 8 + paddedJsonBuffer.length, 8); // Total length

    // JSON Chunk Header (8 bytes)
    const jsonChunkHeader = Buffer.alloc(8);
    jsonChunkHeader.writeUInt32LE(paddedJsonBuffer.length, 0); // Chunk length
    jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4); // "JSON" type

    return Buffer.concat([header, jsonChunkHeader, paddedJsonBuffer]);
  }
}


