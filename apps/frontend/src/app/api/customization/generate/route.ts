/**
 * POST /api/customization/generate
 * Génère une personnalisation pour un produit
 * Forward vers backend NestJS: POST /customization/generate
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPost } from '@/lib/backend-forward';
import { z } from 'zod';

const GenerateRequestSchema = z.object({
  productId: z.string().min(1),
  zoneId: z.string().min(1),
  prompt: z.string().min(1).max(500),
  font: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  size: z.number().int().positive().optional(),
  effect: z.enum(['normal', 'embossed', 'engraved', '3d']).optional(),
  zoneUV: z.object({
    u: z.array(z.number()).length(2),
    v: z.array(z.number()).length(2),
  }),
  modelUrl: z.string().url(),
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();

    // Validation
    const validated = GenerateRequestSchema.parse(body);

    // Forward vers le backend
    const result = await forwardPost('/customization/generate', request, validated);
    return ApiResponseBuilder.success(result.data);
  }, '/api/customization/generate', 'POST');
}
