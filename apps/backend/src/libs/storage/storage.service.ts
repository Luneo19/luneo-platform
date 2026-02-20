import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    // Configurer Cloudinary si disponible
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
  }

  /**
   * Upload un fichier vers le stockage (Cloudinary)
   * AWS S3 a été remplacé par Cloudinary pour économiser 1200$/mois
   * 
   * SECURITY FIX: Added brandId parameter for brand-level file isolation.
   * When brandId is provided, files are stored in brand-specific folders.
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    bucket?: string,
    brandId?: string,
  ): Promise<string> {
    try {
      // SECURITY FIX: Brand-scoped folder structure for data isolation
      const baseFolder = bucket || 'luneo-assets';
      const folder = brandId ? `${baseFolder}/brands/${brandId}` : baseFolder;

      this.logger.log(`Upload vers Cloudinary: ${key} (folder: ${folder})`);
      
      // Utiliser Cloudinary au lieu de S3
      const base64 = buffer.toString('base64');
      const dataUri = `data:${contentType};base64,${base64}`;
      
      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        public_id: key.replace(/\.[^/.]+$/, ''), // Remove extension
        resource_type: 'auto',
      });
      
      this.logger.log(`File uploaded successfully to Cloudinary: ${result.secure_url}`);
      return result.secure_url;
    } catch (error) {
      this.logger.error('Upload failed', { error });
      throw new InternalServerErrorException('File upload failed. Please try again.');
    }
  }

  /**
   * Upload un buffer vers le stockage (alias pour uploadFile)
   */
  async uploadBuffer(
    buffer: Buffer,
    key: string,
    options?: {
      contentType?: string;
      bucket?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<string> {
    return this.uploadFile(
      key,
      buffer,
      options?.contentType || 'application/octet-stream',
      options?.bucket
    );
  }

  /**
   * Supprime un fichier du stockage (Cloudinary)
   */
  async deleteFile(key: string, _bucket?: string): Promise<void> {
    try {
      this.logger.log(`Suppression via Cloudinary: ${key}`);
      
      // Utiliser Cloudinary au lieu de S3
      const publicId = key.replace(/\.[^/.]+$/, ''); // Remove extension
      await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
      });
      
      this.logger.log(`File deleted successfully from Cloudinary: ${key}`);
    } catch (error) {
      this.logger.error('Delete file failed', { error });
      throw new InternalServerErrorException('File deletion failed. Please try again.');
    }
  }

  /**
   * Génère une URL signée pour un fichier (Cloudinary)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      this.logger.log(`Génération d'URL Cloudinary: ${key}`);
      
      // Utiliser Cloudinary au lieu de S3
      const publicId = key.replace(/\.[^/.]+$/, ''); // Remove extension
      const url = cloudinary.url(publicId, {
        secure: true,
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      });
      
      return url;
    } catch (error) {
      this.logger.error('Signed URL generation failed', { error });
      throw new InternalServerErrorException('Failed to generate signed URL. Please try again.');
    }
  }

  /**
   * Liste les fichiers dans un dossier (Cloudinary)
   */
  async listFiles(prefix: string, bucket?: string): Promise<string[]> {
    try {
      this.logger.log(`Listing files with prefix: ${prefix}`);
      
      const folder = bucket ? `${bucket}/${prefix}` : prefix;
      
      // Use Cloudinary Search API for listing files in a folder
      const result = await cloudinary.search
        .expression(`folder:${folder}/*`)
        .sort_by('created_at', 'desc')
        .max_results(500)
        .execute();
      
      const urls: string[] = (result.resources || []).map(
        (resource: { secure_url: string }) => resource.secure_url,
      );
      
      this.logger.log(`Listed ${urls.length} files from Cloudinary folder: ${folder}`);
      return urls;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('List files failed', { error });
      // Graceful degradation: return empty array instead of throwing
      // This prevents cascade failures when Cloudinary is misconfigured
      if (message?.includes('Must supply') || message?.includes('cloud_name')) {
        this.logger.warn('Cloudinary not configured - returning empty file list');
        return [];
      }
      throw new InternalServerErrorException('Failed to list files. Please try again.');
    }
  }
}
