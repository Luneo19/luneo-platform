/**
 * POST /api/referral/withdraw
 * Demande de retrait des commissions
 * Forward vers backend NestJS: POST /referral/withdraw
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    // Forward vers le backend
    const { forwardPost } = await import('@/lib/backend-forward');
    const result = await forwardPost('/referral/withdraw', request, {});

    return result.data;
  }, '/api/referral/withdraw', 'POST');
}
