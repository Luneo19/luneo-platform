/**
 * POST /api/referral/join
 * Inscription au programme d'affiliation
 * Forward vers backend NestJS: POST /referral/join
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { z } from 'zod';

const JoinSchema = z.object({
  email: z.string().email('Email invalide'),
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    const validation = JoinSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Email invalide',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { email } = validation.data;

    // Forward vers le backend
    const { forwardPost } = await import('@/lib/backend-forward');
    const result = await forwardPost('/referral/join', request, {
      email,
    });

    return result.data;
  }, '/api/referral/join', 'POST');
}
