import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { sendProductionReadyEmailSchema } from '@/lib/validation/zod-schemas';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

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
    if (user.role !== 'ADMIN') {
      throw { status: 403, message: 'Accès refusé', code: 'FORBIDDEN' };
    }

    const { orderId, productionFiles } = validatedData;

    // Forward to backend unified email endpoint
    const backendResponse = await fetch(`${API_URL}/api/v1/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        to: user.email,
        subject: `Fichiers de production prêts (${orderId})`,
        html: `<p>Vos fichiers de production sont prêts pour la commande <strong>${orderId}</strong>.</p><ul>${productionFiles.map((file) => `<li><a href="${file.url}">${file.name}</a></li>`).join('')}</ul>`,
        text: `Vos fichiers de production sont prêts pour la commande ${orderId}: ${productionFiles.map((f) => f.url).join(', ')}`,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      serverLogger.error('Production ready email service error', new Error(errorText), {
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
    serverLogger.info('Production ready email sent', {
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
