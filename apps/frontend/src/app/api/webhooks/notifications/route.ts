import { NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { WebhookService } from '@/lib/services/webhook.service';
import { webhookNotificationSchema } from '@/lib/validation/zod-schemas';

/**
 * POST /api/webhooks/notifications
 * Déclenche l'envoi de notifications vers des webhooks externes
 */
export async function POST(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    const { event, data, resource_type, resource_id } = validation.data;

    // Récupérer les webhooks configurés pour cet utilisateur
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true);

    if (webhooksError) {
      logger.dbError('fetch user webhooks', webhooksError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération des webhooks' };
    }

    if (!webhooks || webhooks.length === 0) {
      return {
        message: 'Aucun webhook configuré',
        sent: 0,
        total: 0,
      };
    }

    // Préparer le payload
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      user_id: user.id,
      resource_type,
      resource_id,
    };

    // Convertir les webhooks en format WebhookConfig
    const webhookConfigs = webhooks.map((wh: any) => ({
      url: wh.url,
      secret: wh.secret || undefined,
      events: wh.events || ['*'],
      active: wh.active,
    }));

    // Envoyer vers tous les webhooks
    const results = await WebhookService.sendToMultipleWebhooks(webhookConfigs, payload);

    const successCount = results.filter((r) => r.result.success).length;
    const failedCount = results.length - successCount;

    logger.info('Webhooks notifications sent', {
      userId: user.id,
      event,
      total: results.length,
      success: successCount,
      failed: failedCount,
    });

    return {
      sent: successCount,
      failed: failedCount,
      total: results.length,
      results: results.map((r) => ({
        url: r.config.url,
        success: r.result.success,
        error: r.result.error,
      })),
    };
  }, '/api/webhooks/notifications', 'POST');
}
