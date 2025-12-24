/**
 * Background Removal API (Optimisée)
 * AI-002: Suppression automatique d'arrière-plan avec Replicate rembg
 * Implémente retry, fallback, et gestion des crédits
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponseBuilder } from '@/lib/api-response';
import { AIService } from '@/lib/services/AIService';
import { createClient } from '@/lib/supabase/server';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { track } from '@vercel/analytics';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const requestSchema = z.object({
  imageUrl: z.string().url(),
  mode: z.enum(['auto', 'person', 'product', 'animal']).default('auto'),
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
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Paramètres invalides',
        details: validation.error.issues,
      };
    }

    const { imageUrl, mode } = validation.data;

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

    // Utiliser Replicate rembg avec retry
    if (!process.env.REPLICATE_API_TOKEN) {
      throw {
        status: 500,
        code: 'CONFIGURATION_ERROR',
        message: 'REPLICATE_API_TOKEN non configuré',
      };
    }

    let outputUrl: string;

    try {
      outputUrl = await AIService.retryWithBackoff(async () => {
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        const output = await replicate.run(
          'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
          {
            input: {
              image: imageUrl,
              model: mode === 'auto' ? 'u2net' : mode === 'person' ? 'u2net_human_seg' : 'u2netp',
            },
          }
        );

        return Array.isArray(output) ? output[0] : (output as string);
      });
    } catch (replicateError: any) {
      logger.error('Replicate background removal failed', { error: replicateError });
      Sentry.captureException(replicateError, {
        tags: { service: 'ai-background-removal' },
        extra: { userId: user.id, mode },
      });

      throw {
        status: 500,
        code: 'AI_SERVICE_ERROR',
        message: `Erreur lors de la suppression d'arrière-plan: ${replicateError.message || 'Erreur inconnue'}`,
      };
    }

    // Upload vers Cloudinary
    let cloudinaryUrl: string;
    try {
      cloudinaryUrl = await AIService.retryWithBackoff(async () => {
        const uploadResult = await cloudinary.uploader.upload(outputUrl, {
          folder: 'luneo/ai-studio/background-removal',
          public_id: `${user.id}/${Date.now()}`,
          overwrite: true,
          resource_type: 'image',
          format: 'png', // PNG pour transparence
          quality: 'auto',
        });
        return uploadResult.secure_url;
      });
    } catch (cloudinaryError: any) {
      logger.error('Cloudinary upload failed', { error: cloudinaryError });
      cloudinaryUrl = outputUrl; // Fallback
    }

    const duration = Date.now() - startTime;

    // Track analytics
    track('ai_background_removal_success', {
      userId: user.id,
      duration,
      mode,
    });

    logger.info('Background removal completed', {
      userId: user.id,
      duration,
      mode,
    });

    return ApiResponseBuilder.success({
      outputUrl: cloudinaryUrl,
      maskUrl: null,
      mode,
      provider: 'replicate',
    });
  }, '/api/ai/background-removal', 'POST');
}


