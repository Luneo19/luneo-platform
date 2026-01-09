/**
 * ★★★ API ROUTE - EDITOR PROJECTS ★★★
 * Next.js route for listing and creating editor projects
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';

/**
 * GET /api/editor/projects
 * Liste tous les projets editor
 * Forward vers backend NestJS: GET /api/editor/projects
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/editor/projects', request);
    return result.data;
  }, '/api/editor/projects', 'GET');
}

/**
 * POST /api/editor/projects
 * Crée un nouveau projet editor
 * Forward vers backend NestJS: POST /api/editor/projects
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const result = await forwardPost('/editor/projects', request, body);
    return result.data;
  }, '/api/editor/projects', 'POST');
}


