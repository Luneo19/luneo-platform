import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet, forwardPost, forwardDelete } from '@/lib/backend-forward';
import { managePaymentMethodSchema } from '@/lib/validation/zod-schemas';
import { z } from 'zod';

/**
 * GET /api/billing/payment-methods
 * Récupère les méthodes de paiement de l'utilisateur
 * Forward vers backend NestJS: GET /api/billing/payment-methods
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/billing/payment-methods', request);
    return ApiResponseBuilder.success(result.data);
  }, '/api/billing/payment-methods', 'GET');
}

/**
 * POST /api/billing/payment-methods
 * Ajoute une nouvelle méthode de paiement
 * Forward vers backend NestJS: POST /api/billing/payment-methods
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    // Validation Zod
    const validation = managePaymentMethodSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { paymentMethodId, action } = validation.data;
    const setAsDefault = action === 'set_default';

    const result = await forwardPost('/billing/payment-methods', request, {
      paymentMethodId,
      setAsDefault,
    });

    return ApiResponseBuilder.success(result.data);
  }, '/api/billing/payment-methods', 'POST');
}

/**
 * DELETE /api/billing/payment-methods?id=xxx
 * Supprime une méthode de paiement
 * Forward vers backend NestJS: DELETE /api/billing/payment-methods?id=xxx
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      throw {
        status: 400,
        message: 'Le paramètre id est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    const result = await forwardDelete(`/billing/payment-methods/${paymentMethodId}`, request);

    return ApiResponseBuilder.success(result.data);
  }, '/api/billing/payment-methods', 'DELETE');
}
