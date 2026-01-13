import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams, validateWithZodSchema } from '@/lib/api-response';
import { forwardGet, forwardPost, forwardPut } from '@/lib/backend-forward';
import { createTemplateSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/templates
 * Récupère les templates avec pagination, tri et filtres
 * Forward vers backend NestJS: GET /api/ai-studio/templates
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const result = await forwardGet('/ai-studio/templates', request, {
      page,
      limit,
      ...(category && { category }),
      ...(search && { search }),
    });

    return ApiResponseBuilder.success(result.data);
  }, '/api/templates', 'GET');
}

/**
 * POST /api/templates
 * Crée un nouveau template
 * Forward vers backend NestJS: POST /api/ai-studio/templates
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    // Validation Zod
    const validation = validateWithZodSchema(createTemplateSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const result = await forwardPost('/ai-studio/templates', request, validation.data);
    return ApiResponseBuilder.success(result.data);
  }, '/api/templates', 'POST');
}

/**
 * PUT /api/templates?id=xxx
 * Met à jour un template
 * Forward vers backend NestJS: PUT /api/ai-studio/templates/:id
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      throw {
        status: 400,
        message: 'Le paramètre id est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    const body = await request.json();
    const result = await forwardPut(`/ai-studio/templates/${templateId}`, request, body);
    return ApiResponseBuilder.success(result.data);
  }, '/api/templates', 'PUT');
}
