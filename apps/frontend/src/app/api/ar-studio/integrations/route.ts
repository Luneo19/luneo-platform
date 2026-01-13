/**
 * ★★★ API ROUTE - AR INTEGRATIONS ★★★
 * Route API Next.js pour la gestion des intégrations AR
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';
import { z } from 'zod';

const CreateIntegrationSchema = z.object({
  platform: z.string().min(1),
  name: z.string().min(1).max(200),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  settings: z.record(z.unknown()).optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/ar-studio/integrations
 * Liste toutes les intégrations AR
 * Forward vers backend NestJS: GET /api/ar-studio/integrations
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/ar-studio/integrations', request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/ar-studio/integrations', 'GET');
}

/**
 * POST /api/ar-studio/integrations
 * Crée une nouvelle intégration AR
 * Body: { platform, name, apiKey?, apiSecret?, webhookUrl?, settings?, isActive? }
 * Forward vers backend NestJS: POST /api/ar-studio/integrations
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const validation = CreateIntegrationSchema.safeParse(body);

    if (!validation.success) {
      throw { status: 400, message: 'Données invalides', code: 'VALIDATION_ERROR', details: validation.error.issues };
    }

    const result = await forwardPost('/ar-studio/integrations', request, validation.data);
    return ApiResponseBuilder.success(result.data);
  }, '/api/ar-studio/integrations', 'POST');
}


