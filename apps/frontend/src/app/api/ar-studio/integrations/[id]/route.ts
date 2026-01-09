/**
 * ★★★ API ROUTE - AR INTEGRATION BY ID ★★★
 * Route API Next.js pour la gestion d'une intégration AR spécifique
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPut, forwardDelete } from '@/lib/backend-forward';
import { z } from 'zod';

const UpdateIntegrationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  settings: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/ar-studio/integrations/[id]
 * Récupère une intégration AR par ID
 * Forward vers backend NestJS: GET /api/ar-studio/integrations/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet(`/ar-studio/integrations/${params.id}`, request);
    return result.data;
  }, '/api/ar-studio/integrations/[id]', 'GET');
}

/**
 * PUT /api/ar-studio/integrations/[id]
 * Met à jour une intégration AR
 * Body: { name?, apiKey?, apiSecret?, webhookUrl?, settings?, isActive? }
 * Forward vers backend NestJS: PUT /api/ar-studio/integrations/:id
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const validation = UpdateIntegrationSchema.safeParse(body);

    if (!validation.success) {
      throw { status: 400, message: 'Données invalides', code: 'VALIDATION_ERROR', details: validation.error.issues };
    }

    const result = await forwardPut(`/ar-studio/integrations/${params.id}`, request, validation.data);
    return result.data;
  }, '/api/ar-studio/integrations/[id]', 'PUT');
}

/**
 * DELETE /api/ar-studio/integrations/[id]
 * Supprime une intégration AR
 * Forward vers backend NestJS: DELETE /api/ar-studio/integrations/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardDelete(`/ar-studio/integrations/${params.id}`, request);
    return { success: true };
  }, '/api/ar-studio/integrations/[id]', 'DELETE');
}


