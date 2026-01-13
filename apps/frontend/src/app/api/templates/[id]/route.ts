import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPut, forwardDelete } from '@/lib/backend-forward';

type TemplateRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/templates/[id]
 * Récupère un template par ID
 * Forward vers backend NestJS: GET /api/ai-studio/templates/:id
 */
export async function GET(request: NextRequest, { params }: TemplateRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardGet(`/ai-studio/templates/${id}`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/templates/[id]', 'GET');
}

/**
 * PATCH /api/templates/[id]
 * Met à jour un template
 * Forward vers backend NestJS: PUT /api/ai-studio/templates/:id
 */
export async function PATCH(request: NextRequest, { params }: TemplateRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const body = await request.json();
    const result = await forwardPut(`/ai-studio/templates/${id}`, request, body);
    return ApiResponseBuilder.success(result.data);
  }, '/api/templates/[id]', 'PATCH');
}

/**
 * DELETE /api/templates/[id]
 * Supprime un template
 * Forward vers backend NestJS: DELETE /api/ai-studio/templates/:id
 */
export async function DELETE(request: NextRequest, { params }: TemplateRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardDelete(`/ai-studio/templates/${id}`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/templates/[id]', 'DELETE');
}
