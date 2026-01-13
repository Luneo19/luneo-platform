import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/billing/portal
 * Crée une session du portail client Stripe
 * Forward vers backend NestJS: GET /api/billing/customer-portal
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/billing/customer-portal', request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/billing/portal', 'GET');
}

