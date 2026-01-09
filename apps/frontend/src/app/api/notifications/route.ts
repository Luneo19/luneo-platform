import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';

export const runtime = 'nodejs';

/**
 * GET /api/notifications
 * Récupère les notifications de l'utilisateur
 * Forward vers backend NestJS: GET /notifications
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const unreadOnly = searchParams.get('unreadOnly');

    const queryParams = new URLSearchParams();
    if (page) queryParams.set('page', page);
    if (limit) queryParams.set('limit', limit);
    if (unreadOnly) queryParams.set('unreadOnly', unreadOnly);

    const queryString = queryParams.toString();
    const url = `/notifications${queryString ? `?${queryString}` : ''}`;
    const result = await forwardGet(url, request);
    return result.data;
  }, '/api/notifications', 'GET');
}

/**
 * POST /api/notifications
 * Crée une nouvelle notification (admin/système uniquement)
 * Forward vers backend NestJS: POST /notifications
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const result = await forwardPost('/notifications', request, body);
    return result.data;
  }, '/api/notifications', 'POST');
}
