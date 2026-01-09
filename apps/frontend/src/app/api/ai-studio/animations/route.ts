/**
 * ★★★ API ROUTE - AI ANIMATIONS ★★★
 * Route API Next.js pour la génération d'animations AI
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';
import { z } from 'zod';

const GenerateAnimationSchema = z.object({
  prompt: z.string().min(1).max(1000),
  style: z.string().optional(),
  duration: z.number().int().min(1).max(30).default(5),
  fps: z.number().int().min(24).max(60).default(30),
  resolution: z.enum(['720p', '1080p', '4k']).default('1080p'),
});

/**
 * GET /api/ai-studio/animations
 * Liste toutes les animations AI
 * Forward vers backend NestJS: GET /api/ai-studio/animations
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);
    const status = searchParams.get('status') || undefined;

    const result = await forwardGet('/ai-studio/animations', request, {
      page,
      limit,
      ...(status && { status }),
    });
    return result.data;
  }, '/api/ai-studio/animations', 'GET');
}

/**
 * POST /api/ai-studio/animations
 * Génère une nouvelle animation AI
 * Body: { prompt, style?, duration?, fps?, resolution? }
 * Forward vers backend NestJS: POST /api/ai-studio/animations/generate
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const validation = GenerateAnimationSchema.safeParse(body);

    if (!validation.success) {
      throw { status: 400, message: 'Données invalides', code: 'VALIDATION_ERROR', details: validation.error.issues };
    }

    const result = await forwardPost('/ai-studio/animations/generate', request, validation.data);
    return result.data;
  }, '/api/ai-studio/animations', 'POST');
}

