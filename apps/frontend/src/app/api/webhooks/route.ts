import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { createWebhookSchema } from '@/lib/validation/zod-schemas';
import crypto from 'crypto';

/**
 * POST /api/webhooks
 * Route générique pour recevoir des webhooks
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(createWebhookSchema, request, async (validatedData) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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

    const { data: createdWebhook, error: createError } = await supabase
      .from('webhook_endpoints')
      .insert({
        user_id: user.id,
        name: name.trim(),
        url: url.trim(),
        secret: webhookSecret,
        events,
      })
      .select()
      .single();

    if (createError) {
      logger.dbError('create webhook', createError, {
        userId: user.id,
        webhookName: name,
      });
      throw { status: 500, message: 'Erreur lors de la création du webhook' };
    }

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
