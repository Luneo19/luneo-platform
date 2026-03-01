import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { sendOrderConfirmationEmailSchema } from '@/lib/validation/zod-schemas';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

/**
 * POST /api/emails/send-order-confirmation
 * Envoie un email de confirmation de commande
 * Forward to backend
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(sendOrderConfirmationEmailSchema, request, async (validatedData) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }
    if (user.role !== 'ADMIN') {
      throw { status: 403, message: 'Accès refusé', code: 'FORBIDDEN' };
    }

    const { orderId } = validatedData;

    // Forward to backend unified email endpoint
    const backendResponse = await fetch(`${API_URL}/api/v1/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        to: user.email,
        subject: `Confirmation de commande ${orderId}`,
        html: `<p>Votre commande <strong>${orderId}</strong> a bien été enregistrée.</p>`,
        text: `Votre commande ${orderId} a bien été enregistrée.`,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      serverLogger.error('Order confirmation email service error', new Error(errorText), {
        userId: user.id,
        orderId,
        status: backendResponse.status,
      });
      throw {
        status: backendResponse.status,
        message: 'Erreur lors de l\'envoi de l\'email de confirmation',
        code: 'EMAIL_SERVICE_ERROR',
      };
    }

    await backendResponse.json();
    serverLogger.info('Order confirmation email sent', {
      userId: user.id,
      orderId,
    });

    return ApiResponseBuilder.success({
      orderId,
    }, 'Email de confirmation de commande envoyé avec succès');
  });
}
