/**
 * ★★★ API ROUTE - SEGMENTS ★★★
 * Route API Next.js pour la gestion des segments
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';
import { z } from 'zod';

const CreateSegmentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  criteria: z.record(z.unknown()),
});

/**
 * GET /api/analytics/segments
 * Liste tous les segments analytics
 * Forward vers backend NestJS: GET /api/analytics-advanced/segments
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/analytics-advanced/segments', request);
    return result.data;
  }, '/api/analytics/segments', 'GET');
}

/**
 * POST /api/analytics/segments
 * Crée un nouveau segment analytics
 * Body: { name, description?, criteria }
 * Forward vers backend NestJS: POST /api/analytics-advanced/segments
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const validation = CreateSegmentSchema.safeParse(body);

    if (!validation.success) {
      throw { status: 400, message: 'Données invalides', code: 'VALIDATION_ERROR', details: validation.error.issues };
    }

    const result = await forwardPost('/analytics-advanced/segments', request, validation.data);
    return result.data;
  }, '/api/analytics/segments', 'POST');
}


