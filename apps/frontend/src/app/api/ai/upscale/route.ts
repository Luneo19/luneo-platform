/**
 * Upscale API Route (Optimisée)
 * Agrandissement d'images avec Real-ESRGAN via Replicate
 * Implémente retry, fallback Cloudinary, et gestion des crédits
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponseBuilder } from '@/lib/api-response';
import { AIService } from '@/lib/services/AIService';
import { createClient } from '@/lib/supabase/server';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
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
  scale: z.enum(['2', '4']).default('2'),
  enhanceDetails: z.boolean().default(true),
  denoiseStrength: z.number().min(0).max(1).default(0.3),
});

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

    const creditsRequired = input.scale === '2' ? 2 : 4;

    // Vérifier crédits
    const creditsCheck = await AIService.checkAndDeductCredits(user.id, creditsRequired, supabase);
    if (!creditsCheck.success) {
      throw {
        status: 402,
        code: 'INSUFFICIENT_CREDITS',
        message: creditsCheck.error,
        balance: creditsCheck.balance,
      };
    }

    // Obtenir dimensions originales
    const imageResponse = await fetch(input.imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const metadata = await sharp(imageBuffer).metadata();
    const originalSize = {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };

    let outputUrl: string;

    // Essayer Replicate Real-ESRGAN d'abord
    if (process.env.REPLICATE_API_TOKEN) {
      try {
        outputUrl = await AIService.retryWithBackoff(async () => {
          const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
          const output = await replicate.run(
            'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7f7a5f4d-5afd321d',
            {
              input: {
                image: input.imageUrl,
                scale: parseInt(input.scale),
              },
            }
          );

          return Array.isArray(output) ? output[0] : (output as string);
        });
      } catch (replicateError: any) {
        logger.warn('Replicate upscale failed, using Cloudinary fallback', {
          error: replicateError,
        });

        // Fallback Cloudinary (moins performant mais disponible)
        const scaleNum = parseInt(input.scale);
        outputUrl = cloudinary.url(input.imageUrl, {
          transformation: [
            { width: `*_${scaleNum}`, height: `*_${scaleNum}`, crop: 'limit' },
            { quality: 'auto', format: 'webp' },
          ],
        });
      }
    } else {
      // Fallback Cloudinary uniquement
      const scaleNum = parseInt(input.scale);
      outputUrl = cloudinary.url(input.imageUrl, {
        transformation: [
          { width: `*_${scaleNum}`, height: `*_${scaleNum}`, crop: 'limit' },
          { quality: 'auto', format: 'webp' },
        ],
      });
    }

    // Upload résultat vers Cloudinary pour persistance
    let cloudinaryUrl: string;
    try {
      cloudinaryUrl = await AIService.retryWithBackoff(async () => {
        const uploadResult = await cloudinary.uploader.upload(outputUrl, {
          folder: 'luneo/ai-studio/upscaled',
          public_id: `${user.id}/${Date.now()}`,
          overwrite: true,
          resource_type: 'image',
          format: 'webp',
          quality: 'auto',
        });
        return uploadResult.secure_url;
      });
    } catch (cloudinaryError: any) {
      logger.error('Cloudinary upload failed', { error: cloudinaryError });
      cloudinaryUrl = outputUrl; // Fallback
    }

    const newSize = {
      width: originalSize.width * parseInt(input.scale),
      height: originalSize.height * parseInt(input.scale),
    };

    const duration = Date.now() - startTime;

    // Track analytics
    track('ai_upscale_success', {
      userId: user.id,
      duration,
      scale: input.scale,
    });

    logger.info('Upscale completed', {
      userId: user.id,
      duration,
      scale: input.scale,
    });

    return ApiResponseBuilder.success({
      outputUrl: cloudinaryUrl,
      originalSize,
      newSize,
      scale: parseInt(input.scale),
    });
  }, '/api/ai/upscale', 'POST');
}

