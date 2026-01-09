import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';

type OrderRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/orders/[id]
 * Récupérer une commande spécifique avec tous ses détails
 * Forward vers backend NestJS: GET /api/orders/:id
 */
export async function GET(request: NextRequest, { params }: OrderRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardGet(`/orders/${id}`, request);
    return result.data;
  }, '/api/orders/[id]', 'GET');
}

/**
 * PUT /api/orders/[id]
 * Mettre à jour une commande (principalement le statut)
 * Body: { status, trackingNumber, notes }
 * Forward vers backend NestJS: PUT /orders/:id
 */
export async function PUT(request: NextRequest, { params }: OrderRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const body = await request.json();

    // Si c'est une annulation, utiliser la route cancel
    if (body.status === 'cancelled' || body.status === 'CANCELLED') {
      const result = await forwardPost(`/orders/${id}/cancel`, request, body);
      return result.data;
    }

    // Pour d'autres mises à jour, utiliser PUT
    const result = await forwardPut(`/orders/${id}`, request, body);
    return result.data;
  }, '/api/orders/[id]', 'PUT');
}

/**
 * DELETE /api/orders/[id]
 * Annuler une commande (soft delete via status)
 * Forward vers backend NestJS: POST /api/orders/:id/cancel
 */
export async function DELETE(request: NextRequest, { params }: OrderRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const result = await forwardPost(`/orders/${id}/cancel`, request, {
      reason: body.reason || 'user_cancelled',
      ...body,
    });

    return result.data;
  }, '/api/orders/[id]', 'DELETE');
}
