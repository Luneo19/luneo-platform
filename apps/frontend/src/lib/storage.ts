/**
 * 📦 STORAGE SERVICE - Luneo Platform
 * 
 * Service centralisé pour la gestion des fichiers
 * Supporte Cloudinary et AWS S3
 * Pour un SaaS professionnel et scalable
 */

import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger';

// Configuration Cloudinary
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

export type StorageProvider = 'cloudinary' | 's3' | 'auto';

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  transformation?: any[];
  overwrite?: boolean;
  invalidate?: boolean;
  tags?: string[];
  context?: Record<string, string>;
}

export interface UploadResult {
  url: string;
  publicId?: string;
  secureUrl: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  provider: StorageProvider;
}

export interface DeleteResult {
  success: boolean;
  publicId?: string;
  provider: StorageProvider;
}

/**
 * Upload un fichier Base64 vers Cloudinary
 */
async function uploadToCloudinary(
  base64Data: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const {
      folder = 'luneo/production-files',
      publicId,
      resourceType = 'raw',
      format,
      transformation = [],
      overwrite = true,
      invalidate = true,
      tags = [],
      context = {},
    } = options;

    // Remove data URL prefix if present
    const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
    
    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      `data:${format || 'application/octet-stream'};base64,${base64Clean}`,
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        format,
        transformation,
        overwrite,
        invalidate,
        tags: tags.length > 0 ? tags : undefined,
        context: Object.keys(context).length > 0 ? context : undefined,
      }
    );

    logger.info('File uploaded to Cloudinary', {
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      folder,
    });

    return {
      url: uploadResult.url,
      publicId: uploadResult.public_id,
      secureUrl: uploadResult.secure_url,
      format: uploadResult.format || format || 'unknown',
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
      provider: 'cloudinary',
    };
  } catch (error) {
    logger.error('Cloudinary upload error', error instanceof Error ? error : new Error(String(error)), {
      folder: options.folder,
      resourceType: options.resourceType,
    });
    throw new Error(`Échec de l'upload Cloudinary: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Upload un fichier vers AWS S3
 * Note: Nécessite @aws-sdk/client-s3 installé
 */
async function uploadToS3(
  base64Data: string,
  path: string,
  mimeType: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    // Check if AWS SDK is available
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'luneo-storage';
    const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    const folder = options.folder || 'production-files';
    const key = `${folder}/${path}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read', // Or 'private' based on requirements
      Metadata: options.context || {},
    });

    await s3Client.send(command);

    const url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    logger.info('File uploaded to S3', {
      bucket: bucketName,
      key,
      contentType: mimeType,
      size: buffer.length,
    });

    return {
      url,
      secureUrl: url,
      format: mimeType.split('/')[1] || 'unknown',
      bytes: buffer.length,
      provider: 's3',
    };
  } catch (error) {
    // If AWS SDK is not installed, fallback to Cloudinary
    if ((error as any)?.code === 'MODULE_NOT_FOUND') {
      logger.warn('AWS SDK not installed, falling back to Cloudinary', {
        path,
        mimeType,
      });
      return uploadToCloudinary(base64Data, options);
    }

    logger.error('S3 upload error', error instanceof Error ? error : new Error(String(error)), {
      path,
      mimeType,
    });
    throw new Error(`Échec de l'upload S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Upload un fichier vers le stockage (Cloudinary par défaut, S3 en option)
 */
export async function uploadFile(
  base64Data: string,
  path: string,
  mimeType: string,
  provider: StorageProvider = 'auto',
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    // Auto-detect provider based on environment
    if (provider === 'auto') {
      if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ) {
        provider = 'cloudinary';
      } else if (
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_S3_BUCKET_NAME
      ) {
        provider = 's3';
      } else {
        throw new Error('Aucun provider de stockage configuré (Cloudinary ou S3)');
      }
    }

    switch (provider) {
      case 'cloudinary':
        return uploadToCloudinary(base64Data, {
          ...options,
          folder: options.folder || 'luneo/production-files',
          publicId: options.publicId || path.replace(/\.[^/.]+$/, ''), // Remove extension
        });

      case 's3':
        return uploadToS3(base64Data, path, mimeType, options);

      default:
        throw new Error(`Provider de stockage non supporté: ${provider}`);
    }
  } catch (error) {
    logger.error('File upload error', error instanceof Error ? error : new Error(String(error)), {
      path,
      mimeType,
      provider,
    });
    throw error;
  }
}

/**
 * Supprimer un fichier de Cloudinary
 */
async function deleteFromCloudinary(publicId: string): Promise<DeleteResult> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });

    logger.info('File deleted from Cloudinary', {
      publicId,
      result: result.result,
    });

    return {
      success: result.result === 'ok',
      publicId,
      provider: 'cloudinary',
    };
  } catch (error) {
    logger.error('Cloudinary delete error', error instanceof Error ? error : new Error(String(error)), {
      publicId,
    });
    throw new Error(`Échec de la suppression Cloudinary: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Supprimer un fichier de S3
 */
async function deleteFromS3(path: string): Promise<DeleteResult> {
  try {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'luneo-storage';

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: path,
    });

    await s3Client.send(command);

    logger.info('File deleted from S3', {
      bucket: bucketName,
      key: path,
    });

    return {
      success: true,
      provider: 's3',
    };
  } catch (error) {
    // If AWS SDK is not installed, try Cloudinary
    if ((error as any)?.code === 'MODULE_NOT_FOUND') {
      logger.warn('AWS SDK not installed, trying Cloudinary', { path });
      // Extract public_id from S3 path if possible
      const publicId = path.split('/').pop()?.replace(/\.[^/.]+$/, '');
      if (publicId) {
        return deleteFromCloudinary(publicId);
      }
    }

    logger.error('S3 delete error', error instanceof Error ? error : new Error(String(error)), { path });
    throw new Error(`Échec de la suppression S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Supprimer un ou plusieurs fichiers du stockage
 */
export async function deleteFiles(
  fileUrls: string | string[],
  provider: StorageProvider = 'auto'
): Promise<DeleteResult[]> {
  try {
    const urls = Array.isArray(fileUrls) ? fileUrls : [fileUrls];
    const results: DeleteResult[] = [];

    // Auto-detect provider from URL
    if (provider === 'auto') {
      const firstUrl = urls[0];
      if (firstUrl.includes('cloudinary.com') || firstUrl.includes('res.cloudinary.com')) {
        provider = 'cloudinary';
      } else if (firstUrl.includes('.s3.') || firstUrl.includes('amazonaws.com')) {
        provider = 's3';
      } else {
        // Try Cloudinary first, fallback to S3
        provider = 'cloudinary';
      }
    }

    for (const url of urls) {
      try {
        if (provider === 'cloudinary') {
          // Extract public_id from Cloudinary URL
          // Format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
          const cloudinaryMatch = url.match(/\/upload\/[^/]+\/(.+)\./);
          if (cloudinaryMatch && cloudinaryMatch[1]) {
            const publicId = cloudinaryMatch[1].replace(/^v\d+\//, ''); // Remove version prefix
            const result = await deleteFromCloudinary(publicId);
            results.push(result);
          } else {
            logger.warn('Could not extract public_id from Cloudinary URL', { url });
            results.push({
              success: false,
              provider: 'cloudinary',
            });
          }
        } else if (provider === 's3') {
          // Extract key from S3 URL
          // Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
          const s3Match = url.match(/amazonaws\.com\/(.+)/);
          if (s3Match && s3Match[1]) {
            const key = s3Match[1].split('?')[0]; // Remove query params
            const result = await deleteFromS3(key);
            results.push(result);
          } else {
            logger.warn('Could not extract key from S3 URL', { url });
            results.push({
              success: false,
              provider: 's3',
            });
          }
        }
      } catch (error) {
        logger.error('Error deleting file', error instanceof Error ? error : new Error(String(error)), { url });
        results.push({
          success: false,
          provider,
        });
      }
    }

    return results;
  } catch (error) {
    logger.error('Bulk file delete error', error instanceof Error ? error : new Error(String(error)), {
      fileCount: Array.isArray(fileUrls) ? fileUrls.length : 1,
      provider,
    });
    throw error;
  }
}

/**
 * Extraire l'URL publique d'un fichier depuis une URL Cloudinary ou S3
 */
export function getPublicUrl(url: string): string {
  if (url.includes('cloudinary.com')) {
    return url;
  } else if (url.includes('.s3.') || url.includes('amazonaws.com')) {
    return url.split('?')[0]; // Remove query params
  }
  return url;
}


