import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { withTimeout, DEFAULT_TIMEOUTS, TimeoutError } from '@/libs/resilience/timeout.util';

/**
 * TIMEOUT-01: CloudinaryService avec timeouts
 * Évite les uploads qui bloquent indéfiniment
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('cloudinary.cloudName'),
      api_key: this.configService.get('cloudinary.apiKey'),
      api_secret: this.configService.get('cloudinary.apiSecret'),
    });
  }

  /**
   * TIMEOUT-01: Upload image avec timeout de 60s
   */
  async uploadImage(file: Buffer, folder: string = 'luneo'): Promise<string> {
    const uploadPromise = new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        },
      );

      uploadStream.end(file);
    });

    try {
      return await withTimeout(
        uploadPromise,
        DEFAULT_TIMEOUTS.CLOUDINARY_UPLOAD,
        'Cloudinary.uploadImage',
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        this.logger.error(`Image upload timed out after ${DEFAULT_TIMEOUTS.CLOUDINARY_UPLOAD}ms`);
      }
      throw error;
    }
  }

  /**
   * TIMEOUT-01: Upload video avec timeout de 60s
   */
  async uploadVideo(file: Buffer, folder: string = 'luneo'): Promise<string> {
    const uploadPromise = new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'video',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        },
      );

      uploadStream.end(file);
    });

    try {
      return await withTimeout(
        uploadPromise,
        DEFAULT_TIMEOUTS.CLOUDINARY_UPLOAD,
        'Cloudinary.uploadVideo',
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        this.logger.error(`Video upload timed out after ${DEFAULT_TIMEOUTS.CLOUDINARY_UPLOAD}ms`);
      }
      throw error;
    }
  }

  /**
   * TIMEOUT-01: Delete file avec timeout de 10s
   */
  async deleteFile(publicId: string): Promise<void> {
    const deletePromise = new Promise<void>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    try {
      return await withTimeout(
        deletePromise,
        DEFAULT_TIMEOUTS.CLOUDINARY_DELETE,
        'Cloudinary.deleteFile',
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        this.logger.error(`File deletion timed out after ${DEFAULT_TIMEOUTS.CLOUDINARY_DELETE}ms`);
      }
      throw error;
    }
  }

  generateSignedUrl(publicId: string, options: any = {}): string {
    return cloudinary.url(publicId, {
      sign_url: true,
      ...options,
    });
  }

  /**
   * Health check pour Cloudinary
   */
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await withTimeout(
        cloudinary.api.ping(),
        5000,
        'Cloudinary.healthCheck',
      );
      return { healthy: true, latencyMs: Date.now() - start };
    } catch {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }
}
