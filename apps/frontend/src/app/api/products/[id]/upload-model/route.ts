/**
 * ★★★ API ROUTE - UPLOAD MODÈLE 3D ★★★
 * API route pour uploader un modèle 3D
 * - POST: Upload le modèle
 * - Validation format
 * - Upload vers S3
 */

import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { uploadFileToStorage } from '@/lib/storage/upload-service';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// ========================================
// SCHEMA
// ========================================

const UploadModelSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  fileType: z.string(),
});

// ========================================
// POST - Upload le modèle
// ========================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ApiResponseBuilder.handle(async () => {
    const productId = params.id;
    const body = await request.json();

    // Validation
    const validated = UploadModelSchema.parse(body);

    logger.info('Uploading model', {
      productId,
      fileName: validated.fileName,
      fileSize: validated.fileSize,
    });

    // Validation format
    const allowedFormats = ['.glb', '.gltf', '.usdz', '.fbx', '.obj'];
    const fileExtension = validated.fileName
      .toLowerCase()
      .substring(validated.fileName.lastIndexOf('.'));

    if (!allowedFormats.includes(fileExtension)) {
      return ApiResponseBuilder.badRequest(
        `Format non supporté. Formats autorisés: ${allowedFormats.join(', ')}`
      );
    }

    // Validation taille (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (validated.fileSize > maxSize) {
      return ApiResponseBuilder.badRequest(
        'Fichier trop volumineux. Taille maximum: 100MB'
      );
    }

    // Upload vers S3 si fileUrl est un fichier local/temporaire
    // Sinon, utiliser l'URL fournie (déjà uploadée)
    let finalModelUrl = validated.fileUrl;

    // Si l'URL est locale ou temporaire, uploader vers S3
    if (validated.fileUrl.startsWith('blob:') || validated.fileUrl.startsWith('data:') || validated.fileUrl.startsWith('/tmp/')) {
      try {
        // Télécharger le fichier depuis l'URL temporaire
        const fileResponse = await fetch(validated.fileUrl);
        const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

        // Upload vers S3
        const uploadResult = await uploadFileToStorage(
          fileBuffer,
          validated.fileName,
          {
            provider: 's3',
            folder: `products/${productId}/models`,
          }
        );

        finalModelUrl = uploadResult.url;
        logger.info('Model uploaded to S3', { productId, fileName: validated.fileName, url: finalModelUrl });
      } catch (uploadError: any) {
        logger.error('Error uploading model to S3', { error: uploadError, productId });
        // Fallback: utiliser l'URL fournie même si l'upload a échoué
      }
    }

    // Mettre à jour le produit avec l'URL du modèle via Prisma directement
    try {
      const { db } = await import('@/lib/db');
      
      await db.product.update({
        where: { id: productId },
        data: {
          model3dUrl: finalModelUrl,
          metadata: {
            ...((await db.product.findUnique({ where: { id: productId }, select: { metadata: true } }))?.metadata as any || {}),
            modelUpload: {
              fileName: validated.fileName,
              fileSize: validated.fileSize,
              fileType: validated.fileType,
              uploadedAt: new Date().toISOString(),
            },
          },
        },
      });
      
      await db.$disconnect();
    } catch (updateError: any) {
      logger.error('Error updating product with model URL', { error: updateError, productId });
      // Ne pas échouer si la mise à jour échoue, on retourne quand même l'URL
    }

    return ApiResponseBuilder.success({
      productId,
      modelUrl: finalModelUrl,
      fileName: validated.fileName,
      fileSize: validated.fileSize,
      fileType: validated.fileType,
      uploadedAt: new Date().toISOString(),
    });
  }, '/api/products/[id]/upload-model', 'POST');
}

