import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';

type TicketMessagesRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/support/tickets/[id]/messages
 * Récupère les messages d'un ticket
 * Note: Les messages sont inclus dans GET /support/tickets/:id
 * Forward vers backend NestJS: GET /support/tickets/:id (inclut les messages)
 */
export async function GET(request: NextRequest, { params }: TicketMessagesRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const result = await forwardGet(`/support/tickets/${id}`, request);
    return (result.data as any)?.messages || [];
  }, '/api/support/tickets/[id]/messages', 'GET');
}

/**
 * POST /api/support/tickets/[id]/messages
 * Ajoute un message à un ticket
 * Forward vers backend NestJS: POST /support/tickets/:id/messages
 */
export async function POST(request: NextRequest, { params }: TicketMessagesRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      throw {
        status: 400,
        message: 'Le contenu du message est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    const result = await forwardPost(`/support/tickets/${id}/messages`, request, { content });
    return ApiResponseBuilder.success(result.data);
  }, '/api/support/tickets/[id]/messages', 'POST');
}
