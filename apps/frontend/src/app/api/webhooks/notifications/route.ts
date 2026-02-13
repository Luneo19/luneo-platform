import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { webhookNotificationSchema } from '@/lib/validation/zod-schemas';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

/**
 * POST /api/webhooks/notifications
 * Déclenche l'envoi de notifications vers des webhooks externes
 * Forward to backend
 */
export async function POST(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const user = await getUserFromRequest(request);

    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    
    // Validation Zod
    const validation = webhookNotificationSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    // Forward to backend
    const backendResponse = await fetch(`${API_URL}/api/v1/webhooks/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(validation.data),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      serverLogger.error('Failed to send webhook notifications', {
        userId: user.id,
        status: backendResponse.status,
        error: errorText,
      });
      throw { status: 500, message: 'Erreur lors de l\'envoi des notifications webhook' };
    }

    const result = await backendResponse.json();
    serverLogger.info('Webhooks notifications sent', {
      userId: user.id,
      event: validation.data.event,
      total: result.total,
      success: result.sent,
      failed: result.failed,
    });

    return result;
  }, '/api/webhooks/notifications', 'POST');
}
