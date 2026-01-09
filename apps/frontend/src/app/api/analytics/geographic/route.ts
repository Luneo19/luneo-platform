/**
 * ★★★ API ROUTE - GEOGRAPHIC ANALYSIS ★★★
 * Route API Next.js pour l'analyse géographique
 * Forward vers backend NestJS: GET /api/analytics/geographic
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    const result = await forwardGet('/analytics/geographic', request, {
      timeRange,
    });

    return result.data;
  }, '/api/analytics/geographic', 'GET');
}



