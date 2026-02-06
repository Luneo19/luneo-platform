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
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    bucket?: string
  ): Promise<string> {
    try {
      this.logger.log(`Upload vers Cloudinary: ${key}`);
      
      // Utiliser Cloudinary au lieu de S3
      const base64 = buffer.toString('base64');
      const dataUri = `data:${contentType};base64,${base64}`;
      
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: bucket || 'luneo-assets',
        public_id: key.replace(/\.[^/.]+$/, ''), // Remove extension
        resource_type: 'auto',
      });
      
      this.logger.log(`File uploaded successfully to Cloudinary: ${result.secure_url}`);
      return result.secure_url;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw new InternalServerErrorException(`Échec de l'upload (Cloudinary): ${error.message}`);
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
  async deleteFile(key: string, bucket?: string): Promise<void> {
    try {
      this.logger.log(`Suppression via Cloudinary: ${key}`);
      
      // Utiliser Cloudinary au lieu de S3
      const publicId = key.replace(/\.[^/.]+$/, ''); // Remove extension
      await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
      });
      
      this.logger.log(`File deleted successfully from Cloudinary: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw new InternalServerErrorException(`Échec de la suppression (Cloudinary): ${error.message}`);
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
      this.logger.error(`Failed to generate signed URL: ${error.message}`);
      throw new InternalServerErrorException(`Échec de génération d'URL (Cloudinary): ${error.message}`);
    }
  }

  /**
   * Liste les fichiers dans un dossier
   */
  async listFiles(prefix: string, bucket?: string): Promise<string[]> {
    try {
      this.logger.log(`Listing files with prefix: ${prefix}`);
      
      // Simulation de liste de fichiers
      return [];
    } catch (error) {
      this.logger.error(`Failed to list files: ${error.message}`);
      throw error;
    }
  }
}
