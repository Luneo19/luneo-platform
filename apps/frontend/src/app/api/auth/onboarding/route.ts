import { getUserFromRequest } from '@/lib/auth/get-user';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { onboardingSchema } from '@/lib/validation/zod-schemas';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * POST /api/auth/onboarding
 * Complète le processus d'onboarding d'un utilisateur
 * Forwards to backend API /api/v1/auth/onboarding
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    
    // Validation Zod
    const validation = onboardingSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    // Forward to backend API
    const cookieHeader = request.headers.get('cookie') || '';
    const response = await fetch(`${API_URL}/api/v1/auth/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validation.data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la mise à jour du profil' }));
      throw {
        status: response.status,
        message: errorData.message || 'Erreur lors de la mise à jour du profil',
        code: 'ONBOARDING_ERROR',
      };
    }

    const result = await response.json();

    logger.info('Onboarding step completed', {
      userId: user.id,
      step: validation.data.step,
    });

    return ApiResponseBuilder.success(result);
  }, '/api/auth/onboarding', 'POST');
}

/**
 * GET /api/auth/onboarding
 * Récupère le statut d'onboarding de l'utilisateur
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Forward to backend API
    const cookieHeader = request.headers.get('cookie') || '';
    const response = await fetch(`${API_URL}/api/v1/auth/onboarding`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la récupération du statut' }));
      throw {
        status: response.status,
        message: errorData.message || 'Erreur lors de la récupération du statut',
        code: 'ONBOARDING_ERROR',
      };
    }

    const result = await response.json();
    return ApiResponseBuilder.success(result);
  }, '/api/auth/onboarding', 'GET');
}
