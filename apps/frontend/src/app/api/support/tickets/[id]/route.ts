import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPut } from '@/lib/backend-forward';

type TicketRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/support/tickets/[id]
 * Récupère un ticket de support spécifique
 * Forward vers backend NestJS: GET /support/tickets/:id
 */
export async function GET(request: NextRequest, { params }: TicketRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardGet(`/support/tickets/${id}`, request);
    return result.data;
  }, '/api/support/tickets/[id]', 'GET');
}

/**
 * PUT /api/support/tickets/[id]
 * Met à jour un ticket de support
 * Forward vers backend NestJS: PUT /support/tickets/:id
 */
export async function PUT(request: NextRequest, { params }: TicketRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const body = await request.json();
    const result = await forwardPut(`/support/tickets/${id}`, request, body);
    return result.data;
  }, '/api/support/tickets/[id]', 'PUT');
}
