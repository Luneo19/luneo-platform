import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';

/**
 * GET /api/support/tickets
 * Liste les tickets de support de l'utilisateur
 * Forward vers backend NestJS: GET /support/tickets
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    const queryParams = new URLSearchParams();
    if (status) queryParams.set('status', status);
    if (category) queryParams.set('category', category);
    if (page) queryParams.set('page', page);
    if (limit) queryParams.set('limit', limit);

    const queryString = queryParams.toString();
    const url = `/support/tickets${queryString ? `?${queryString}` : ''}`;
    const result = await forwardGet(url, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/support/tickets', 'GET');
}

/**
 * POST /api/support/tickets
 * Crée un nouveau ticket de support
 * Forward vers backend NestJS: POST /support/tickets
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const { subject, description, category, priority } = body;

    if (!subject || !description) {
      throw {
        status: 400,
        message: 'Le sujet et la description sont requis',
        code: 'VALIDATION_ERROR',
      };
    }

    const result = await forwardPost('/support/tickets', request, {
      subject,
      description,
      category,
      priority,
    });
    return ApiResponseBuilder.success(result.data);
  }, '/api/support/tickets', 'POST');
}
