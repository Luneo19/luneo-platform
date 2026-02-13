/**
 * ★★★ UPLOAD SERVICE ★★★
 * Service pour uploader des fichiers vers S3/R2/Cloudinary
 */

import { logger } from '@/lib/logger';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface UploadConfig {
  provider: 's3' | 'cloudinary' | 'r2';
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  folder?: string;
}

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  contentType: string;
}

/**
 * Upload un fichier vers le stockage
 */
export async function uploadFileToStorage(
  file: File | Buffer,
  fileName: string,
  config?: UploadConfig
): Promise<UploadResult> {
  try {
    const provider = config?.provider || detectProviderFromEnv();
    const fileBuffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    const contentType = file instanceof File ? file.type : 'application/octet-stream';

    switch (provider) {
      case 's3':
      case 'r2':
        return await uploadToS3(fileBuffer, fileName, contentType, config);
      case 'cloudinary':
        return await uploadToCloudinary(fileBuffer, fileName, contentType, config);
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  } catch (error: unknown) {
    logger.error('Error uploading file to storage', { error, fileName });
    throw error;
  }
}

/**
 * Upload vers S3/R2
 */
async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  config?: UploadConfig
): Promise<UploadResult> {
  try {
    const bucket = config?.bucket || process.env.S3_BUCKET || process.env.R2_BUCKET || '';
    const region = config?.region || process.env.AWS_REGION || process.env.R2_REGION || 'us-east-1';
    const accessKeyId = config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '';
    const endpoint = config?.endpoint || process.env.R2_ENDPOINT;
    const folder = config?.folder || 'uploads';

    if (!bucket || !accessKeyId || !secretAccessKey) {
      throw new Error('S3/R2 credentials not configured');
    }

    const key = `${folder}/${Date.now()}-${fileName}`;

    const s3Client = new S3Client({
      region: config?.provider === 'r2' ? 'auto' : region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      ...(endpoint && { endpoint }),
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read', // Or use bucket policy
      })
    );

    const url = endpoint
      ? `${endpoint}/${key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    logger.info('File uploaded to S3/R2', { bucket, key, url, size: fileBuffer.length });

    return {
      url,
      key,
      size: fileBuffer.length,
      contentType,
    };
  } catch (error: unknown) {
    logger.error('Error uploading to S3/R2', { error, fileName });
    throw error;
  }
}

/**
 * Upload vers Cloudinary
 */
async function uploadToCloudinary(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  config?: UploadConfig
): Promise<UploadResult> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const folder = config?.folder || 'uploads';

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary credentials not configured');
    }

    // Convert buffer to base64
    const base64File = fileBuffer.toString('base64');
    const dataUri = `data:${contentType};base64,${base64File}`;

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', dataUri);
    formData.append('folder', folder);
    formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || '');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudinary upload failed: ${error}`);
    }

    const result = await response.json();

    logger.info('File uploaded to Cloudinary', {
      publicId: result.public_id,
      url: result.secure_url,
      size: result.bytes,
    });

    return {
      url: result.secure_url,
      key: result.public_id,
      size: result.bytes,
      contentType: result.format,
    };
  } catch (error: unknown) {
    logger.error('Error uploading to Cloudinary', { error, fileName });
    throw error;
  }
}

/**
 * Détecte le provider depuis les variables d'environnement
 */
function detectProviderFromEnv(): 's3' | 'cloudinary' | 'r2' {
  if (process.env.CLOUDINARY_CLOUD_NAME) return 'cloudinary';
  if (process.env.R2_BUCKET || process.env.R2_ENDPOINT) return 'r2';
  return 's3';
}

