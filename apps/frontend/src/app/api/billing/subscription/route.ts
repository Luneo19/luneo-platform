import { NextRequest } from 'next/server';
import { ApiResponseBuilder, validateWithZodSchema } from '@/lib/api-response';
import { forwardGet, forwardPut } from '@/lib/backend-forward';
import { updateSubscriptionSchema } from '@/lib/validation/zod-schemas';

/**
 * GET /api/billing/subscription
 * Récupère les informations d'abonnement de l'utilisateur
 * Forward vers backend NestJS: GET /api/billing/subscription
 * Note: Le backend doit gérer la récupération depuis Stripe et la base de données
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const result = await forwardGet('/billing/subscription', request);
    return result.data;
  }, '/api/billing/subscription', 'GET');
}

/**
 * PUT /api/billing/subscription
 * Met à jour l'abonnement (annulation, changement de plan, etc.)
 * Body: { action, planId? }
 * Forward vers backend NestJS: PUT /api/billing/subscription
 * Note: Le backend doit gérer les actions Stripe et la mise à jour de la base de données
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(updateSubscriptionSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    // Pour l'instant, on forwarde vers le backend
    // Le backend devra implémenter la logique de mise à jour
    const result = await forwardPut('/billing/subscription', request, validation.data);
    return result.data;
  }, '/api/billing/subscription', 'PUT');
}
