/**
 * ★★★ API ROUTE - SOUMISSION POD ★★★
 * Forwards to NestJS backend. Backend handles order/product/design lookup and POD provider submission.
 */

import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

const PODSubmitSchema = z.object({
  orderId: z.string().cuid(),
  autoFulfill: z.boolean().optional().default(false),
  notifyCustomer: z.boolean().optional().default(true),
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> | { provider: string } }
) {
  return ApiResponseBuilder.handle(
    async () => {
      const resolvedParams = params instanceof Promise ? await params : params;
      const { provider } = resolvedParams;
      const body = await request.json().catch(() => {
        throw { status: 400, message: 'Body JSON invalide', code: 'INVALID_JSON' };
      });

      const parseResult = PODSubmitSchema.safeParse(body);
      if (!parseResult.success) {
        throw {
          status: 400,
          message: 'Données invalides',
          code: 'VALIDATION_ERROR',
          details: parseResult.error.errors,
        };
      }
      const validated = parseResult.data;

      const supportedProviders = ['printful', 'printify', 'gelato'];
      if (!supportedProviders.includes(provider.toLowerCase())) {
        return ApiResponseBuilder.badRequest(
          `Provider non supporté: ${provider}. Providers supportés: ${supportedProviders.join(', ')}`
        );
      }

      logger.info('Submitting order to POD (forwarding to backend)', {
        orderId: validated.orderId,
        provider,
      });

      const backendResponse = await fetch(`${API_URL}/api/v1/pod/${provider}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify(validated),
      });

      if (!backendResponse.ok) {
        const err = await backendResponse.json().catch(() => ({}));
        const message = (err as { message?: string }).message || 'Erreur lors de la soumission POD';
        if (backendResponse.status === 404) return ApiResponseBuilder.notFound(message);
        if (backendResponse.status === 403) throw { status: 403, message: 'Accès refusé', code: 'FORBIDDEN' };
        throw { status: backendResponse.status, message, code: 'POD_SUBMIT_ERROR' };
      }

      const result = await backendResponse.json();
      return ApiResponseBuilder.success(result);
    },
    '/api/pod/[provider]/submit',
    'POST'
  );
}
