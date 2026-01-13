/**
 * ★★★ API ROUTE - COHORT ANALYSIS ★★★
 * Route API Next.js pour l'analyse de cohortes
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/analytics/cohorts
 * Récupère les données d'analyse de cohortes
 * Query params: timeRange?, startDate?, endDate?
 * Forward vers backend NestJS: GET /api/analytics-advanced/cohorts
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '90d';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const result = await forwardGet('/analytics-advanced/cohorts', request, {
      timeRange,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });
    return ApiResponseBuilder.success(result.data);
  }, '/api/analytics/cohorts', 'GET');
}


