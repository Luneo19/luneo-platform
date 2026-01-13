import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPatch, forwardDelete } from '@/lib/backend-forward';

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/products/[id]
 * Récupère un produit spécifique
 * Forward vers backend NestJS: GET /api/products/:id
 */
export async function GET(request: NextRequest, { params }: ProductRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardGet(`/products/${id}`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/products/[id]', 'GET');
}

/**
 * PUT /api/products/[id]
 * Mettre à jour un produit
 * Forward vers backend NestJS: PATCH /api/products/:id
 */
export async function PUT(request: NextRequest, { params }: ProductRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const body = await request.json();

    const result = await forwardPatch(`/products/${id}`, request, body);
    return ApiResponseBuilder.success(result.data);
  }, '/api/products/[id]', 'PUT');
}

/**
 * DELETE /api/products/[id]
 * Supprimer un produit
 * Forward vers backend NestJS: DELETE /api/products/:id
 */
export async function DELETE(request: NextRequest, { params }: ProductRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardDelete(`/products/${id}`, request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/products/[id]', 'DELETE');
}
