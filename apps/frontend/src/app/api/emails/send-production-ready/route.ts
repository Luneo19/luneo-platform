import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { sendProductionReadyEmailSchema } from '@/lib/validation/zod-schemas';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * POST /api/emails/send-production-ready
 * Envoie un email de notification que la production est prête
 * Forward to backend
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(sendProductionReadyEmailSchema, request, async (validatedData) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { orderId, productionFiles } = validatedData;

    // Forward to backend
    const backendResponse = await fetch(`${API_URL}/api/v1/emails/send-production-ready`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        orderId,
        productionFiles,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      logger.error('Production ready email service error', new Error(errorText), {
        userId: user.id,
        orderId,
        status: backendResponse.status,
      });
      throw {
        status: backendResponse.status,
        message: 'Erreur lors de l\'envoi de l\'email de production prête',
        code: 'EMAIL_SERVICE_ERROR',
      };
    }

    const result = await backendResponse.json();
    logger.info('Production ready email sent', {
      userId: user.id,
      orderId,
      filesCount: productionFiles.length,
    });

    return ApiResponseBuilder.success({
      orderId,
      filesCount: productionFiles.length,
    }, 'Email de production prête envoyé avec succès');
  });
}
