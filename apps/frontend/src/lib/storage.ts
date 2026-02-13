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

// ⚠️ AWS DÉSACTIVÉ - Seul Cloudinary est disponible (coût AWS: 1200$/mois)
export type StorageProvider = 'cloudinary' | 'auto';

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  transformation?: Array<Record<string, unknown>>;
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
 * ⚠️ AWS DÉSACTIVÉ - Cette fonction redirige vers Cloudinary
 * AWS a coûté 1200$/mois, nous utilisons Cloudinary gratuit à la place
 */
async function uploadToS3(
  base64Data: string,
  path: string,
  mimeType: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  // AWS DÉSACTIVÉ - Rediriger vers Cloudinary
  logger.warn('AWS S3 est désactivé (coût: 1200$/mois). Utilisation de Cloudinary à la place.', {
    path,
    mimeType,
  });
  return uploadToCloudinary(base64Data, options);
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
    // ⚠️ AWS DÉSACTIVÉ - Forcer Cloudinary uniquement
    if (provider === 'auto') {
      if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ) {
        provider = 'cloudinary';
      } else {
        throw new Error('Aucun provider de stockage configuré. AWS est désactivé (coût: 1200$/mois). Configurez Cloudinary.');
      }
    }
    
    // ⚠️ AWS DÉSACTIVÉ - Seul Cloudinary est supporté
    // Toute tentative d'utiliser 's3' est automatiquement redirigée vers Cloudinary
    if (provider === 'cloudinary' || provider === 'auto') {
      return uploadToCloudinary(base64Data, {
        ...options,
        folder: options.folder || 'luneo/production-files',
        publicId: options.publicId || path.replace(/\.[^/.]+$/, ''), // Remove extension
      });
    }

    throw new Error(`Provider de stockage non supporté: ${provider}. AWS est désactivé (coût: 1200$/mois).`);
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
 * ⚠️ AWS DÉSACTIVÉ - Cette fonction redirige vers Cloudinary
 * AWS a coûté 1200$/mois, nous utilisons Cloudinary gratuit à la place
 */
async function deleteFromS3(path: string): Promise<DeleteResult> {
  // AWS DÉSACTIVÉ - Rediriger vers Cloudinary
  logger.warn('AWS S3 est désactivé (coût: 1200$/mois). Tentative de suppression via Cloudinary.', { path });
  // Extract public_id from S3 path if possible
  const publicId = path.split('/').pop()?.replace(/\.[^/.]+$/, '');
  if (publicId) {
    return deleteFromCloudinary(publicId);
  }
  return {
    success: false,
    provider: 'cloudinary', // AWS désactivé, retour cloudinary même en cas d'échec
  };
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
    // ⚠️ AWS DÉSACTIVÉ - Forcer Cloudinary uniquement
    if (provider === 'auto') {
      const firstUrl = urls[0];
      if (firstUrl.includes('cloudinary.com') || firstUrl.includes('res.cloudinary.com')) {
        provider = 'cloudinary';
      } else if (firstUrl.includes('.s3.') || firstUrl.includes('amazonaws.com')) {
        // AWS DÉSACTIVÉ - Rediriger vers Cloudinary
        logger.warn('URL S3 détectée mais AWS est désactivé. Tentative via Cloudinary.');
        provider = 'cloudinary';
      } else {
        // Utiliser Cloudinary par défaut
        provider = 'cloudinary';
      }
    }
    
    // ⚠️ AWS DÉSACTIVÉ - Seul Cloudinary est supporté
    // provider est déjà 'cloudinary' à ce stade (défini dans le bloc if précédent)

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
        } else {
          // ⚠️ AWS DÉSACTIVÉ - Tenter via Cloudinary pour les URLs S3 détectées
          logger.warn('URL S3 détectée mais AWS est désactivé. Tentative via Cloudinary.', { url });
          // Extract public_id from S3 URL if possible
          const s3Match = url.match(/amazonaws\.com\/(.+)/);
          if (s3Match && s3Match[1]) {
            const key = s3Match[1].split('?')[0];
            const publicId = key.split('/').pop()?.replace(/\.[^/.]+$/, '');
            if (publicId) {
              const result = await deleteFromCloudinary(publicId);
              results.push(result);
            } else {
              results.push({
                success: false,
                provider: 'cloudinary',
              });
            }
          } else {
            logger.warn('Could not extract key from S3 URL', { url });
            results.push({
              success: false,
              provider: 'cloudinary',
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



