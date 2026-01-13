/**
 * ★★★ API ROUTE - AI TEMPLATES ★★★
 * Route API Next.js pour la gestion des templates AI
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';
import { z } from 'zod';

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string(),
  subcategory: z.string().optional(),
  prompt: z.string().min(1),
  style: z.string().optional(),
  thumbnailUrl: z.string().url(),
  previewUrl: z.string().url().optional(),
  price: z.number().nonnegative().default(0),
  isPremium: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/ai-studio/templates
 * Liste tous les templates AI
 * Forward vers backend NestJS: GET /api/ai-studio/templates
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await forwardGet('/ai-studio/templates', request, {
      page,
      limit,
      ...(category && { category }),
      ...(search && { search }),
    });
    return ApiResponseBuilder.success(result.data);
  }, '/api/ai-studio/templates', 'GET');
}

/**
 * POST /api/ai-studio/templates
 * Crée un nouveau template AI
 * Body: { name, category, prompt, style?, thumbnailUrl, ... }
 * Forward vers backend NestJS: POST /api/ai-studio/templates
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const validation = CreateTemplateSchema.safeParse(body);

    if (!validation.success) {
      throw { status: 400, message: 'Données invalides', code: 'VALIDATION_ERROR', details: validation.error.issues };
    }

    const result = await forwardPost('/ai-studio/templates', request, validation.data);
    return ApiResponseBuilder.success(result.data);
  }, '/api/ai-studio/templates', 'POST');
}

