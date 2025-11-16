import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { S3Service } from '@/libs/s3/s3.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ExportSettings, AssetInfo, ExportResult } from '../interfaces/render.interface';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Exporte des assets
   */
  async exportAssets(assets: AssetInfo[], options: ExportSettings): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting asset export: ${assets.length} assets`);

      const exportResult: ExportResult = {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Asset export failed: ${errorMessage}`);
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }
}


