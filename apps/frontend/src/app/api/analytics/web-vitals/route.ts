/**
 * Web Vitals API
 * Endpoint pour recevoir et stocker les métriques Core Web Vitals
 * Note: Le backend n'a pas encore de route POST/GET /analytics/web-vitals
 * TODO: Implémenter POST/GET /analytics/web-vitals dans le backend NestJS
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardPost, forwardGet } from '@/lib/backend-forward';

const requestSchema = z.object({
  name: z.enum(['CLS', 'FID', 'FCP', 'LCP', 'TTFB', 'INP']),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  delta: z.number().optional(),
  id: z.string(),
  url: z.string().optional(),
  timestamp: z.number(),
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      throw {
        status: 400,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const result = await forwardPost('/analytics/web-vitals', request, validation.data);
    return result.data;
  }, '/api/analytics/web-vitals', 'POST');
}

export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('name');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const queryParams = new URLSearchParams();
    if (metricName) queryParams.set('name', metricName);
    if (startDate) queryParams.set('startDate', startDate);
    if (endDate) queryParams.set('endDate', endDate);

    const queryString = queryParams.toString();
    const url = `/analytics/web-vitals${queryString ? `?${queryString}` : ''}`;
    const result = await forwardGet(url, request);
    return result.data;
  }, '/api/analytics/web-vitals', 'GET');
}













