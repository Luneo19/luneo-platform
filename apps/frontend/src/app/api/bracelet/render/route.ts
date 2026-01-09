/**
 * POST /api/bracelet/render
 * Génère une image PNG haute résolution du bracelet personnalisé
 * Forward vers backend NestJS: POST /bracelet/render
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPost } from '@/lib/backend-forward';
import { z } from 'zod';

const RenderBraceletSchema = z.object({
  text: z.string().min(1),
  font: z.string().min(1),
  fontSize: z.number().positive(),
  alignment: z.string().min(1),
  position: z.string().min(1),
  color: z.string().min(1),
  material: z.string().min(1),
  width: z.number().optional().default(3840),
  height: z.number().optional().default(2160),
  format: z.enum(['png', 'jpg']).optional().default('png'),
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();

    // Validation
    const validated = RenderBraceletSchema.parse(body);

    // Forward vers le backend
    const result = await forwardPost('/bracelet/render', request, validated);
    return result.data;
  }, '/api/bracelet/render', 'POST');
}
