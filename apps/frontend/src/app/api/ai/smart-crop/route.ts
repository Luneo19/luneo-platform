/**
 * Smart Crop API Route (Optimisée)
 * Recadrage intelligent d'images avec détection de focus
 * Implémente retry et gestion des crédits
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponseBuilder } from '@/lib/api-response';
import { AIService } from '@/lib/services/AIService';
import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { track } from '@vercel/analytics';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const schema = z.object({
  imageUrl: z.string().url(),
  targetAspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3']),
  focusPoint: z.enum(['auto', 'face', 'center', 'product']).default('auto'),
});

const aspectRatioMap: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '4:3': { width: 1600, height: 1200 },
};

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const startTime = Date.now();
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, code: 'UNAUTHORIZED', message: 'Non authentifié' };
    }

    const body = await request.json();
    const input = schema.parse(body);

    // Vérifier crédits
    const creditsCheck = await AIService.checkAndDeductCredits(user.id, 1, supabase);
    if (!creditsCheck.success) {
      throw {
        status: 402,
        code: 'INSUFFICIENT_CREDITS',
        message: creditsCheck.error,
        balance: creditsCheck.balance,
      };
    }

    // Traitement avec retry
    const result = await AIService.retryWithBackoff(async () => {
      // Télécharger image
      const imageResponse = await fetch(input.imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image');
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const metadata = await sharp(imageBuffer).metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image metadata');
      }

      const targetSize = aspectRatioMap[input.targetAspectRatio];
      const targetAspect = targetSize.width / targetSize.height;
      const sourceAspect = metadata.width / metadata.height;

      let cropX = 0;
      let cropY = 0;
      let cropWidth = metadata.width;
      let cropHeight = metadata.height;

      // Calculer zone de crop
      if (sourceAspect > targetAspect) {
        // Image plus large, crop horizontal
        cropWidth = Math.round(metadata.height * targetAspect);
        cropX =
          input.focusPoint === 'center'
            ? Math.round((metadata.width - cropWidth) / 2)
            : 0; // TODO: Implémenter détection face/product
      } else {
        // Image plus haute, crop vertical
        cropHeight = Math.round(metadata.width / targetAspect);
        cropY =
          input.focusPoint === 'center'
            ? Math.round((metadata.height - cropHeight) / 2)
            : 0;
      }

      // Appliquer crop et resize
      const croppedBuffer = await sharp(imageBuffer)
        .extract({
          left: cropX,
          top: cropY,
          width: cropWidth,
          height: cropHeight,
        })
        .resize(targetSize.width, targetSize.height, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 90 })
        .toBuffer();

      // Upload vers Cloudinary
      return new Promise<{
        outputUrl: string;
        cropArea: { x: number; y: number; width: number; height: number };
        originalSize: { width: number; height: number };
        newSize: { width: number; height: number };
      }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'luneo/ai-studio/crops',
              public_id: `${user.id}/${Date.now()}`,
              resource_type: 'image',
              format: 'webp',
            },
            (error, result) => {
              if (error) {
                reject(error);
                return;
              }

              if (!result) {
                reject(new Error('Upload failed'));
                return;
              }

              resolve({
                outputUrl: result.secure_url,
                cropArea: { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
                originalSize: { width: metadata.width, height: metadata.height },
                newSize: targetSize,
              });
            }
          )
          .end(croppedBuffer);
      });
    });

    const duration = Date.now() - startTime;

    // Track analytics
    track('ai_smart_crop_success', {
      userId: user.id,
      duration,
      aspectRatio: input.targetAspectRatio,
    });

    logger.info('Smart crop completed', {
      userId: user.id,
      duration,
      aspectRatio: input.targetAspectRatio,
    });

    return ApiResponseBuilder.success(result);
  }, '/api/ai/smart-crop', 'POST');
}

