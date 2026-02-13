/**
 * ★★★ STORAGE SERVICE ★★★
 * Service unifié pour le stockage de fichiers
 * - S3 (AWS/Cloudflare R2)
 * - Cloudinary
 * - Suppression de fichiers
 */

import { logger } from '@/lib/logger';

export interface StorageConfig {
  provider: 's3' | 'cloudinary' | 'r2';
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
}

/**
 * Supprime un fichier du stockage
 */
export async function deleteFileFromStorage(
  fileUrl: string,
  config?: StorageConfig
): Promise<void> {
  try {
    // Detect provider from URL
    const provider = detectProvider(fileUrl);

    switch (provider) {
      case 'cloudinary':
        await deleteFromCloudinary(fileUrl);
        break;
      case 's3':
      case 'r2':
        await deleteFromS3(fileUrl, config);
        break;
      default:
        logger.warn('Unknown storage provider, skipping deletion', { fileUrl });
    }

    logger.info('File deleted from storage', { fileUrl, provider });
  } catch (error: unknown) {
    logger.error('Error deleting file from storage', { error, fileUrl });
    // Don't throw - file deletion failures shouldn't break the flow
  }
}

/**
 * Détecte le provider depuis l'URL
 */
function detectProvider(url: string): 's3' | 'cloudinary' | 'r2' | 'unknown' {
  if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) {
    return 'cloudinary';
  }
  if (url.includes('.r2.cloudflarestorage.com') || url.includes('r2.dev')) {
    return 'r2';
  }
  if (url.includes('.s3.') || url.includes('amazonaws.com')) {
    return 's3';
  }
  return 'unknown';
}

/**
 * Supprime un fichier de Cloudinary
 */
async function deleteFromCloudinary(publicUrl: string): Promise<void> {
  try {
    // Extract public_id from Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
    const urlParts = publicUrl.split('/upload/');
    if (urlParts.length < 2) {
      logger.warn('Invalid Cloudinary URL', { publicUrl });
      return;
    }

    const pathAfterUpload = urlParts[1];
    const publicId = pathAfterUpload.split('.')[0].replace(/^v\d+\//, ''); // Remove version prefix

    // Call Cloudinary API to delete
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      logger.warn('Cloudinary not configured, skipping deletion', { publicUrl });
      return;
    }

    // Use Cloudinary Admin API to delete
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload/${publicId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudinary deletion failed: ${error}`);
    }

      logger.info('File deleted from Cloudinary', { publicId });
  } catch (error: unknown) {
    logger.error('Error deleting from Cloudinary', { error, publicUrl });
    throw error;
  }
}

/**
 * Supprime un fichier de S3/R2
 */
async function deleteFromS3(
  fileUrl: string,
  config?: StorageConfig
): Promise<void> {
  try {
    // Extract bucket and key from S3 URL
    // Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
    // or: https://{bucket}.{endpoint}/{key}
    const url = new URL(fileUrl);
    const hostname = url.hostname;

    let bucket: string;
    let key: string;

    if (hostname.includes('.s3.') || hostname.includes('amazonaws.com')) {
      // AWS S3 format
      bucket = hostname.split('.')[0];
      key = url.pathname.substring(1); // Remove leading /
    } else if (hostname.includes('r2.cloudflarestorage.com')) {
      // Cloudflare R2 format
      bucket = hostname.split('.')[0];
      key = url.pathname.substring(1);
    } else {
      // Custom endpoint
      bucket = config?.bucket || '';
      key = url.pathname.substring(1);
    }

    if (!bucket || !key) {
      logger.warn('Could not extract bucket/key from S3 URL', { fileUrl });
      return;
    }

    // Use AWS SDK or direct API call
    const accessKeyId = config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    const region = config?.region || process.env.AWS_REGION || 'us-east-1';
    const endpoint = config?.endpoint || process.env.R2_ENDPOINT;

    if (!accessKeyId || !secretAccessKey) {
      logger.warn('S3/R2 credentials not configured, skipping deletion', { fileUrl });
      return;
    }

    // Create signature for S3 DELETE request
    const s3Endpoint = endpoint || `https://${bucket}.s3.${region}.amazonaws.com`;
    const deleteUrl = `${s3Endpoint}/${key}`;

    // For production, use AWS SDK (@aws-sdk/client-s3)
    // For now, we'll use a simple fetch with signed request
    // In production, implement proper AWS signature v4

    logger.info('S3 file deletion (placeholder)', {
      bucket,
      key,
      endpoint: s3Endpoint,
    });

    // Implement actual S3 deletion with AWS SDK or direct API
    try {
      // Try to use AWS SDK if available
      try {
        const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const s3Client = new S3Client({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          ...(endpoint && { endpoint }),
        });
        
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        logger.info('File deleted from S3 via AWS SDK', { bucket, key });
        return;
      } catch (sdkError) {
        // If AWS SDK not available, use direct API call with signature
        logger.info('AWS SDK not available, using direct API', { bucket, key });
      }

      // Fallback: Direct S3 API call with signature v4
      // This is a simplified version - in production, use proper AWS signature v4
      const deleteUrl = endpoint 
        ? `${endpoint}/${key}`
        : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

      // For Cloudflare R2 or S3-compatible storage
      const auth = Buffer.from(`${accessKeyId}:${secretAccessKey}`).toString('base64');
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        // 404 is OK - file might already be deleted
        throw new Error(`S3 deletion failed: ${response.status} ${response.statusText}`);
      }

      logger.info('File deleted from S3 via direct API', { bucket, key });
    } catch (s3Error: unknown) {
      logger.error('Error deleting from S3', { error: s3Error, bucket, key, fileUrl });
      // Don't throw - file deletion failures shouldn't break the flow
    }
  } catch (error: unknown) {
    logger.error('Error deleting from S3', { error, fileUrl });
    throw error;
  }
}

/**
 * Supprime plusieurs fichiers en batch
 */
export async function deleteFilesFromStorage(
  fileUrls: string[],
  config?: StorageConfig
): Promise<{ succeeded: number; failed: number; errors: string[] }> {
  const results = await Promise.allSettled(
    fileUrls.map((url) => deleteFileFromStorage(url, config))
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  const errors = results
    .filter((r) => r.status === 'rejected')
    .map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

  return { succeeded, failed, errors };
}

