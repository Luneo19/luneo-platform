/**
 * Text-to-Design API Route (Optimisée)
 * Génère un design depuis un prompt texte avec DALL-E 3
 * Implémente retry, fallback, et gestion des crédits
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponseBuilder } from '@/lib/api-response';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { aiGenerateRateLimit } from '@/lib/rate-limit';
import { AIService } from '@/lib/services/AIService';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import OpenAI from 'openai';
import Replicate from 'replicate';
import { v2 as cloudinary } from 'cloudinary';
import * as Sentry from '@sentry/nextjs';
import { track } from '@vercel/analytics';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const schema = z.object({
  prompt: z.string().min(1).max(1000),
  style: z.enum(['modern', 'vintage', 'minimal', 'bold', 'playful']).default('modern'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3']).default('1:1'),
  colorScheme: z.array(z.string()).optional(),
  negativePrompt: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const startTime = Date.now();
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, code: 'UNAUTHORIZED', message: 'Non authentifié' };
    }

    // Rate limiting
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const identifier = getClientIdentifier(request, user.id);
      const { success, remaining, reset } = await checkRateLimit(identifier, aiGenerateRateLimit);
      if (!success) {
        throw {
          status: 429,
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Limite atteinte. Réessayez après ${reset.toLocaleTimeString()}.`,
        };
      }
    }

    // Validation
    const body = await request.json();
    const input = schema.parse(body);

    // Vérifier et déduire crédits
    const creditsCheck = await AIService.checkAndDeductCredits(user.id, 5, supabase);
    if (!creditsCheck.success) {
      throw {
        status: 402,
        code: 'INSUFFICIENT_CREDITS',
        message: creditsCheck.error,
        balance: creditsCheck.balance,
      };
    }

    // Construire prompt optimisé
    const stylePrompts: Record<string, string> = {
      modern: 'modern, clean, contemporary design',
      vintage: 'vintage, retro, classic style',
      minimal: 'minimalist, simple, clean',
      bold: 'bold, vibrant, eye-catching',
      playful: 'playful, fun, colorful',
    };

    const sizeMap: Record<string, '1024x1024' | '1792x1024' | '1024x1792'> = {
      '1:1': '1024x1024',
      '16:9': '1792x1024',
      '9:16': '1024x1792',
      '4:3': '1024x1024',
    };

    const enhancedPrompt = `${input.prompt}, ${stylePrompts[input.style]}${
      input.colorScheme ? `, colors: ${input.colorScheme.join(', ')}` : ''
    }${input.negativePrompt ? `, avoid: ${input.negativePrompt}` : ''}`;

    let imageUrl: string;
    let revisedPrompt: string | undefined;

    // Générer avec retry et fallback
    try {
      imageUrl = await AIService.retryWithBackoff(async () => {
        // Essayer OpenAI d'abord
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder') {
          try {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const response = await openai.images.generate({
              model: 'dall-e-3',
              prompt: enhancedPrompt,
              size: sizeMap[input.aspectRatio],
              quality: 'standard',
              style: 'vivid',
              n: 1,
            });

            const url = response.data?.[0]?.url;
            revisedPrompt = response.data?.[0]?.revised_prompt;

            if (url) {
              return url;
            }
          } catch (openaiError: any) {
            logger.warn('OpenAI failed, trying Replicate fallback', { error: openaiError });
            throw openaiError; // Will trigger fallback
          }
        }

        // Fallback Replicate
        if (process.env.REPLICATE_API_TOKEN) {
          const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
          const output = await replicate.run(
            'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
            {
              input: {
                prompt: enhancedPrompt,
                aspect_ratio:
                  input.aspectRatio === '1:1'
                    ? '1:1'
                    : input.aspectRatio === '16:9'
                    ? '16:9'
                    : '9:16',
              },
            }
          );

          return Array.isArray(output) ? output[0] : (output as string);
        }

        throw new Error('No AI provider configured');
      });
    } catch (error: any) {
      logger.error('AI generation failed', { error, userId: user.id });
      Sentry.captureException(error, {
        tags: { service: 'ai-text-to-design' },
        extra: { userId: user.id, prompt: enhancedPrompt },
      });

      throw {
        status: 500,
        code: 'AI_GENERATION_ERROR',
        message: `Erreur lors de la génération: ${error.message || 'Erreur inconnue'}`,
      };
    }

    // Upload Cloudinary avec retry
    let cloudinaryUrl: string;
    try {
      cloudinaryUrl = await AIService.retryWithBackoff(async () => {
        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
          folder: 'luneo/ai-studio',
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
      cloudinaryUrl = imageUrl; // Fallback sur URL originale
    }

    // Sauvegarder design
    const { data: design, error: designError } = await supabase
      .from('designs')
      .insert({
        user_id: user.id,
        prompt: enhancedPrompt,
        revised_prompt: revisedPrompt,
        preview_url: cloudinaryUrl,
        original_url: imageUrl,
        status: 'completed',
        metadata: {
          style: input.style,
          aspectRatio: input.aspectRatio,
          colorScheme: input.colorScheme,
          source: 'text-to-design',
          generation_time_ms: Date.now() - startTime,
        },
      })
      .select()
      .single();

    if (designError) {
      logger.error('Failed to save design', { error: designError, userId: user.id });
      // Ne pas échouer complètement si la sauvegarde échoue
    }

    const duration = Date.now() - startTime;

    // Track analytics
    track('ai_text_to_design_success', {
      userId: user.id,
      duration,
      style: input.style,
    });

    logger.info('Text-to-design completed', {
      userId: user.id,
      designId: design?.id,
      duration,
    });

    return ApiResponseBuilder.success({
      design: design || {
        id: null,
        preview_url: cloudinaryUrl,
        original_url: imageUrl,
        prompt: enhancedPrompt,
        revised_prompt: revisedPrompt,
      },
      imageUrl: cloudinaryUrl,
      revisedPrompt,
      duration_ms: duration,
    });
  }, '/api/ai/text-to-design', 'POST');
}

