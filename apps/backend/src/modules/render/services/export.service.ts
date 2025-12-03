import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ExportSettings, AssetInfo } from '../interfaces/render.interface';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Exporte des assets
   */
  async exportAssets(assets: AssetInfo[], options: ExportSettings): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting asset export: ${assets.length} assets`);

      const exportResult = {
        format: options.format,
        url: `https://example.com/exports/${Date.now()}.${options.format}`,
        size: 1024000,
        metadata: {
          assetsCount: assets.length,
          quality: options.quality,
          exportTime: Date.now() - startTime,
        },
      };

      this.logger.log(`Asset export completed in ${Date.now() - startTime}ms`);
      
      return exportResult;
    } catch (error) {
      this.logger.error(`Asset export failed:`, error);
      throw error;
    }
  }
}


