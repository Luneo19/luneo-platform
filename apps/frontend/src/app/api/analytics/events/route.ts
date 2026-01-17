/**
 * ★★★ API ROUTE - BEHAVIORAL EVENTS ★★★
 * Route API Next.js pour les événements comportementaux
 * Forward vers backend NestJS: GET /api/analytics/events
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';
import { logger } from '@/lib/logger';

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

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    // Route POST pour les événements analytics
    // Pour l'instant, on accepte et on ignore (pas de backend implémenté)
    const body = await request.json().catch(() => ({}));
    
    // Log l'événement mais ne pas bloquer
    logger.info('Analytics event received', { 
      eventType: body.type || body.name,
      timestamp: new Date().toISOString(),
    });

    return ApiResponseBuilder.success({ 
      received: true,
      timestamp: new Date().toISOString(),
    }, 'Event received', 201);
  }, '/api/analytics/events', 'POST');
}
