/**
 * Text-to-Design API Route (Optimisée)
 * Génère un design depuis un prompt texte avec DALL-E 3
 * Forward vers backend NestJS: POST /ai/generate
 * Note: Utilise l'endpoint generate avec un prompt optimisé
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiResponseBuilder } from '@/lib/api-response';

const schema = z.object({
  prompt: z.string().min(1).max(1000),
  style: z.enum(['modern', 'vintage', 'minimal', 'bold', 'playful']).default('modern'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3']).default('1:1'),
  colorScheme: z.array(z.string()).optional(),
  negativePrompt: z.string().optional(),
});

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

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Paramètres invalides',
        details: validation.error.issues,
      };
    }

    const input = validation.data;

    // Construire prompt optimisé
    const enhancedPrompt = `${input.prompt}, ${stylePrompts[input.style]}${
      input.colorScheme ? `, colors: ${input.colorScheme.join(', ')}` : ''
    }${input.negativePrompt ? `, avoid: ${input.negativePrompt}` : ''}`;

    // Forward vers le backend /ai/generate
    const { forwardPost } = await import('@/lib/backend-forward');
    const result = await forwardPost('/ai/generate', request, {
      prompt: enhancedPrompt,
      size: sizeMap[input.aspectRatio],
      quality: 'standard',
      style: 'vivid',
    });

    return {
      design: {
        preview_url: (result.data as any)?.url,
        original_url: (result.data as any)?.url,
        prompt: enhancedPrompt,
        revised_prompt: (result.data as any)?.revisedPrompt,
      },
      imageUrl: (result.data as any)?.url,
      revisedPrompt: (result.data as any)?.revisedPrompt,
    };
  }, '/api/ai/text-to-design', 'POST');
}
