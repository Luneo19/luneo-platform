import { NextRequest } from 'next/server';
import { ApiResponseBuilder, getPaginationParams, validateWithZodSchema } from '@/lib/api-response';
import { forwardGet, forwardPost, forwardPut } from '@/lib/backend-forward';
import { createClipartSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/cliparts
 * Récupère les cliparts avec pagination, tri et filtres
 * Forward vers backend NestJS: GET /cliparts
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const publicOnly = searchParams.get('publicOnly');

    const queryParams = new URLSearchParams();
    if (page) queryParams.set('page', page.toString());
    if (limit) queryParams.set('limit', limit.toString());
    if (category) queryParams.set('category', category);
    if (search) queryParams.set('search', search);
    if (publicOnly) queryParams.set('publicOnly', publicOnly);

    const queryString = queryParams.toString();
    const url = `/cliparts${queryString ? `?${queryString}` : ''}`;
    const result = await forwardGet(url, request);
    return result.data;
  }, '/api/cliparts', 'GET');
}

/**
 * POST /api/cliparts
 * Crée un nouveau clipart
 * Forward vers backend NestJS: POST /cliparts
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    // Validation Zod
    const validation = validateWithZodSchema(createClipartSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const result = await forwardPost('/cliparts', request, validation.data);
    return result.data;
  }, '/api/cliparts', 'POST');
}

/**
 * PUT /api/cliparts?id=xxx
 * Met à jour un clipart
 * Forward vers backend NestJS: PUT /cliparts/:id
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const clipartId = searchParams.get('id');

    if (!clipartId) {
      throw {
        status: 400,
        message: 'Le paramètre id est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    const body = await request.json();
    const result = await forwardPut(`/cliparts/${clipartId}`, request, body);
    return result.data;
  }, '/api/cliparts', 'PUT');
}
