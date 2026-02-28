import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { sendWelcomeEmailSchema } from '@/lib/validation/zod-schemas';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

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
    if (user.role !== 'ADMIN') {
      throw { status: 403, message: 'Accès refusé', code: 'FORBIDDEN' };
    }

    const { email, name } = validatedData;

    // Forward to backend unified email endpoint
    const backendResponse = await fetch(`${API_URL}/api/v1/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        to: email,
        subject: 'Bienvenue chez Luneo !',
        html: `<p>Bonjour ${name || 'Utilisateur'},</p><p>Bienvenue chez Luneo.</p>`,
        text: `Bonjour ${name || 'Utilisateur'}, bienvenue chez Luneo.`,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      serverLogger.error('Email service error', new Error(errorText), {
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
    serverLogger.info('Welcome email sent', {
      userId: user.id,
      email,
      recipientName: name,
    });

    return ApiResponseBuilder.success({
      email,
    }, 'Email de bienvenue envoyé avec succès');
  });
}
