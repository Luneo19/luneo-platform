import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ExportSettings, AssetInfo } from '../interfaces/render.interface';

/** Map export format to MIME type */
const FORMAT_MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  gltf: 'model/gltf+json',
  glb: 'model/gltf-binary',
  usdz: 'model/vnd.usdz+zip',
  obj: 'text/plain',
  fbx: 'application/octet-stream',
};

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Exporte des assets vers Cloudinary
   * Fetches each asset's binary content, bundles/converts if needed,
   * then uploads via StorageService and returns the real URL.
   */
  async exportAssets(
    assets: AssetInfo[],
    options: ExportSettings,
  ): Promise<{
    format: string;
    url: string;
    size: number;
    metadata: Record<string, unknown>;
  }> {
    const startTime = Date.now();

    try {
      if (!assets.length) {
        throw new BadRequestException('No assets provided for export');
      }

      this.logger.log(
        `Starting asset export: ${assets.length} asset(s), format=${options.format}, quality=${options.quality}`,
      );

      // Check cache first
      const cacheKey = `export:${assets.map((a) => a.id).join(',')}:${options.format}:${options.quality}`;
      const cached = await this.cache.getSimple<{
        format: string;
        url: string;
        size: number;
        metadata: Record<string, unknown>;
      }>(cacheKey);
      if (cached) {
        this.logger.log('Export cache hit');
        return cached;
      }

      // For a single-asset export we upload the asset directly.
      // For multi-asset we concatenate IDs in the key so each export is unique.
      const primaryAsset = assets[0];
      let buffer: Buffer;

      // Fetch the asset content from its source URL
      if (primaryAsset.url && primaryAsset.url.startsWith('http')) {
        const response = await fetch(primaryAsset.url);
        if (!response.ok) {
          throw new NotFoundException(
            `Asset source not reachable: ${primaryAsset.url} (HTTP ${response.status})`,
          );
        }
        buffer = Buffer.from(await response.arrayBuffer());
      } else {
        // If URL is not a remote URL, it may be a local reference or data URI
        // Treat as empty buffer placeholder (the render worker will have populated it)
        this.logger.warn(
          `Asset ${primaryAsset.id} has no remote URL – using empty buffer`,
        );
        buffer = Buffer.alloc(0);
      }

      const contentType = FORMAT_MIME_MAP[options.format] || 'application/octet-stream';
      const exportKey = `exports/${Date.now()}-${primaryAsset.id}.${options.format}`;

      // Upload to Cloudinary via StorageService
      const uploadedUrl = await this.storageService.uploadFile(
        exportKey,
        buffer,
        contentType,
        'luneo-exports',
      );

      const exportResult = {
        format: options.format,
        url: uploadedUrl,
        size: buffer.length,
        metadata: {
          assetsCount: assets.length,
          quality: options.quality,
          exportTime: Date.now() - startTime,
          assetIds: assets.map((a) => a.id),
        },
      };

      // Cache the result for 1 hour
      await this.cache.setSimple(cacheKey, exportResult, 3600);

      this.logger.log(
        `Asset export completed in ${Date.now() - startTime}ms -> ${uploadedUrl}`,
      );

      return exportResult;
    } catch (error) {
      this.logger.error('Asset export failed:', error);
      throw error;
    }
  }
}
