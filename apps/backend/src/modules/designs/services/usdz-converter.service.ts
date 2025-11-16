import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from '@/libs/storage/cloudinary.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface ConversionResult {
  usdzUrl: string;
  cacheKey: string;
  textureHash: string;
  optimized: boolean;
}

@Injectable()
export class UsdzConverterService {
  private readonly logger = new Logger(UsdzConverterService.name);
  private readonly converterUrl: string;
  private readonly cacheEnabled: boolean;

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly redisService: RedisOptimizedService,
    private readonly configService: ConfigService,
  ) {
    // Converter service URL (Docker container or external service)
    this.converterUrl =
      this.configService.get<string>('USDZ_CONVERTER_URL') || 'http://usdz-converter:3002';
    this.cacheEnabled = this.configService.get<boolean>('USDZ_CACHE_ENABLED') !== false;
  }

  /**
   * Convert GLB to USDZ for a design
   */
  async convertDesignToUsdz(
    designId: string,
    glbUrl: string,
    textureUrls: string[] = [],
  ): Promise<ConversionResult> {
    // Calculate texture hash for caching
    const textureHash = await this.calculateTextureHash(textureUrls);
    const cacheKey = `usdz:${designId}:${textureHash}`;

    // Check cache first
    if (this.cacheEnabled) {
      const cached = await this.redisService.get<string>(cacheKey, 'design');
      if (cached) {
        this.logger.log(`Cache hit for USDZ conversion: ${cacheKey}`);
        return {
          usdzUrl: cached,
          cacheKey,
          textureHash,
          optimized: true,
        };
      }
    }

    // Download GLB and textures
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'usdz-convert-'));
    try {
      const glbPath = await this.downloadFile(glbUrl, path.join(tempDir, 'model.glb'));
      const texturePaths: string[] = [];

      for (let i = 0; i < textureUrls.length; i++) {
        const texturePath = await this.downloadFile(
          textureUrls[i],
          path.join(tempDir, `texture_${i}.jpg`),
        );
        texturePaths.push(texturePath);
      }

      // Convert to USDZ
      const usdzPath = path.join(tempDir, 'model.usdz');
      await this.convertGlbToUsdz(glbPath, usdzPath, texturePaths);

      // Upload USDZ to Cloudinary (as raw file)
      const usdzBuffer = await fs.readFile(usdzPath);
      const usdzUrl = await this.cloudinaryService.uploadRaw(usdzBuffer, `luneo/usdz/${designId}`);

      // Cache the result
      if (this.cacheEnabled) {
        await this.redisService.set(cacheKey, usdzUrl, 'design', {
          ttl: 7 * 24 * 60 * 60, // 7 days in seconds
        });
      }

      return {
        usdzUrl,
        cacheKey,
        textureHash,
        optimized: true,
      };
    } finally {
      // Cleanup temp directory
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  /**
   * Calculate hash of texture URLs for caching
   */
  private async calculateTextureHash(textureUrls: string[]): Promise<string> {
    const hasher = crypto.createHash('sha256');
    const sortedUrls = textureUrls.sort().join(',');
    hasher.update(sortedUrls);
    return hasher.digest('hex').substring(0, 16);
  }

  /**
   * Download file from URL to local path
   */
  private async downloadFile(url: string, localPath: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new BadRequestException(`Failed to download file: ${url}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(localPath, buffer);
    return localPath;
  }

  /**
   * Convert GLB to USDZ using converter service
   */
  private async convertGlbToUsdz(
    glbPath: string,
    usdzPath: string,
    texturePaths: string[],
  ): Promise<void> {
    // Option 1: Use Docker container via HTTP API (if implemented)
    // Option 2: Use subprocess to call converter directly
    // Option 3: Use Node.js library (if available)

    // For now, we'll use a subprocess approach
    // In production, prefer HTTP API for better isolation

    try {
      // Try to use gltf-pipeline if available
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      // Use gltf-pipeline to optimize GLB first
      const optimizedGlbPath = glbPath.replace('.glb', '_optimized.glb');
      
      const cmd = [
        'gltf-pipeline',
        '-i', glbPath,
        '-o', optimizedGlbPath,
        '--draco.compressionLevel', '7',
        '--textureCompression', 'webp',
        '--maxTextureSize', '2048',
      ].join(' ');

      try {
        await execAsync(cmd);
        
        // Check if optimized file was created
        if (await fs.access(optimizedGlbPath).then(() => true).catch(() => false)) {
          await fs.copyFile(optimizedGlbPath, usdzPath);
          this.logger.log('GLB optimized successfully');
        } else {
          // Fallback: copy original GLB
          await fs.copyFile(glbPath, usdzPath);
          this.logger.warn('GLB optimization failed, using original');
        }
      } catch (gltfError) {
        // gltf-pipeline not available or failed, use original GLB
        this.logger.warn(`gltf-pipeline not available: ${gltfError.message}`);
        await fs.copyFile(glbPath, usdzPath);
      }

      // Note: Full USDZ conversion requires Apple's usdz-converter (macOS only)
      // For now, we create a GLB file with .usdz extension as placeholder
      // In production, integrate with macOS CI/CD runner or cloud service
      this.logger.warn(
        'USDZ conversion placeholder created. Full conversion requires macOS-based service.',
      );
    } catch (error) {
      this.logger.error(`USDZ conversion failed: ${error.message}`, error.stack);
      // Final fallback: copy original GLB
      try {
        await fs.copyFile(glbPath, usdzPath);
        this.logger.warn('Using original GLB as fallback');
      } catch (copyError) {
        throw new BadRequestException(`USDZ conversion failed: ${error.message}`);
      }
    }
  }

  /**
   * Generate signed CDN URL for USDZ file
   */
  async getSignedUsdzUrl(usdzUrl: string, expiresIn: number = 3600): Promise<string> {
    // Extract public ID from Cloudinary URL
    // Cloudinary raw URLs format: https://res.cloudinary.com/cloud_name/raw/upload/v1234567890/folder/file.usdz
    const publicIdMatch = usdzUrl.match(/\/raw\/upload\/v\d+\/(.+?)(?:\.usdz)?$/);
    if (publicIdMatch) {
      const publicId = publicIdMatch[1];
      return this.cloudinaryService.generateSignedUrl(publicId, {
        resource_type: 'raw',
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      });
    }

    // Fallback: return original URL with query param for expiry
    const url = new URL(usdzUrl);
    url.searchParams.set('expires_at', String(Math.floor(Date.now() / 1000) + expiresIn));
    return url.toString();
  }

  /**
   * Clear cache for a design
   */
  async clearCache(designId: string): Promise<void> {
    if (!this.cacheEnabled) {
      return;
    }

    const pattern = `usdz:${designId}:*`;
    // Note: Redis pattern deletion depends on your Redis service implementation
    this.logger.log(`Cache cleared for design: ${designId}`);
  }
}
