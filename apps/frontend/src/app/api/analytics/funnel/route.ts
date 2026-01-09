/**
 * ★★★ API ROUTE - FUNNEL ANALYSIS ★★★
 * Route API Next.js pour l'analyse de funnel
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/analytics/funnel
 * Récupère les données d'analyse de funnel
 * Query params: funnelId?, timeRange?, startDate?, endDate?
 * Forward vers backend NestJS: GET /api/analytics/funnel
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get('funnelId') || undefined;
    const timeRange = searchParams.get('timeRange') || '30d';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const result = await forwardGet('/analytics/funnel', request, {
      ...(funnelId && { funnelId }),
      timeRange,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });
    return result.data;
  }, '/api/analytics/funnel', 'GET');
}


