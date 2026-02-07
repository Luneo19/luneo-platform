import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { sendWelcomeEmailSchema } from '@/lib/validation/zod-schemas';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * POST /api/emails/send-welcome
 * Envoie un email de bienvenue à un nouvel utilisateur
 * Forward to backend
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(sendWelcomeEmailSchema, request, async (validatedData) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { email, name } = validatedData;

    // Forward to backend
    const backendResponse = await fetch(`${API_URL}/api/v1/emails/send-welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        email,
        name: name || user.email?.split('@')[0] || 'Utilisateur',
        userId: user.id,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      logger.error('Email service error', new Error(errorText), {
        userId: user.id,
        email,
        status: backendResponse.status,
      });
      throw {
        status: backendResponse.status,
        message: 'Erreur lors de l\'envoi de l\'email de bienvenue',
        code: 'EMAIL_SERVICE_ERROR',
      };
    }

    const result = await backendResponse.json();
    logger.info('Welcome email sent', {
      userId: user.id,
      email,
      recipientName: name,
    });

    return ApiResponseBuilder.success({
      email,
    }, 'Email de bienvenue envoyé avec succès');
  });
}
