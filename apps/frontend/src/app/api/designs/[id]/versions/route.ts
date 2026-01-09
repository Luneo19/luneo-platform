import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';
import { z } from 'zod';
import { nameSchema, descriptionSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/designs/[id]/versions
 * Récupère l'historique des versions d'un design
 * Forward vers backend NestJS: GET /designs/:id/versions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId } = await params;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const autoOnly = searchParams.get('auto_only') || searchParams.get('autoOnly');

    const queryParams = new URLSearchParams();
    if (page) queryParams.set('page', page);
    if (limit) queryParams.set('limit', limit);
    if (autoOnly) queryParams.set('autoOnly', autoOnly);

    const queryString = queryParams.toString();
    const url = `/designs/${designId}/versions${queryString ? `?${queryString}` : ''}`;
    const result = await forwardGet(url, request);
    return result.data;
  }, '/api/designs/[id]/versions', 'GET');
}

/**
 * POST /api/designs/[id]/versions
 * Crée une nouvelle version d'un design (versioning manuel)
 * Forward vers backend NestJS: POST /designs/:id/versions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId } = await params;
    const body = await request.json();

    // Validation body avec Zod
    const createVersionSchema = z.object({
      name: nameSchema.optional(),
      description: descriptionSchema.optional(),
    });

    const validatedBody = createVersionSchema.parse(body || {});

    const result = await forwardPost(`/designs/${designId}/versions`, request, validatedBody);
    return result.data;
  }, '/api/designs/[id]/versions', 'POST');
}

