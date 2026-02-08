import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { createWebhookSchema } from '@/lib/validation/zod-schemas';
import crypto from 'crypto';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

/**
 * POST /api/webhooks
 * Route générique pour recevoir des webhooks
 * Forwards to backend API
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(createWebhookSchema, request, async (validatedData) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { name, url, events, secret } = validatedData as {
      name: string;
      url: string;
      events: string[];
      secret?: string;
    };

    // Générer un secret pour signer les webhooks (si non fourni)
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

    // Forward to backend API
    const cookieHeader = request.headers.get('cookie') || '';
    const response = await fetch(`${API_URL}/api/v1/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        name: name.trim(),
        url: url.trim(),
        secret: webhookSecret,
        events,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la création du webhook' }));
      logger.error('Failed to create webhook via backend', {
        userId: user.id,
        webhookName: name,
        status: response.status,
      });
      throw { status: response.status, message: errorData.message || 'Erreur lors de la création du webhook' };
    }

    const createdWebhook = await response.json();

    logger.info('Webhook created', {
      userId: user.id,
      webhookId: createdWebhook.id,
      webhookName: name,
      eventsCount: events.length,
    });

    return ApiResponseBuilder.success({
      webhook: {
        ...createdWebhook,
        secret: undefined, // Ne pas exposer le secret
      },
    }, 'Webhook créé avec succès', 201);
  });
}
