/**
 * ★★★ API ROUTE - BEHAVIORAL EVENTS ★★★
 * Route API Next.js pour les événements comportementaux
 * Forward vers backend NestJS: GET /api/analytics/events
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const eventType = searchParams.get('eventType');

    const result = await forwardGet('/analytics/events', request, {
      timeRange,
      ...(eventType && { eventType }),
    });

    return ApiResponseBuilder.success(result.data);
  }, '/api/analytics/events', 'GET');
}
