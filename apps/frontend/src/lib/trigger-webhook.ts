/**
 * TRIGGER WEBHOOKS
 * Déclencher les webhooks sortants pour notifier les clients
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Events disponibles pour les webhooks
 */
export type WebhookEvent =
  | 'design.created'
  | 'design.completed'
  | 'design.deleted'
  | 'order.created'
  | 'order.completed'
  | 'order.shipped'
  | 'order.cancelled'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'subscription.created'
  | 'subscription.renewed'
  | 'subscription.cancelled';

/**
 * Déclencher un webhook
 * Usage dans les API routes:
 * 
 * await triggerWebhook('design.created', {
 *   design_id: '123',
 *   prompt: 'Logo AR',
 *   status: 'completed'
 * });
 */
export async function triggerWebhook(
  eventType: WebhookEvent,
  payload: Record<string, any>
): Promise<void> {
  try {
    const supabase = await createClient();

    // Appeler la fonction SQL qui crée les deliveries
    const { error } = await supabase.rpc('create_webhook_delivery', {
      p_event_type: eventType,
      p_payload: payload,
    });

    if (error) {
      logger.error('Error creating webhook delivery', {
        error,
        eventType,
        payload,
      });
      return;
    }

    logger.info('Webhook triggered', {
      eventType,
      payloadKeys: Object.keys(payload),
    });

    // Note: Les webhooks seront envoyés par un worker séparé
    // qui lit la table webhook_deliveries et fait les requêtes HTTP
  } catch (error: any) {
    logger.error('Trigger webhook error', {
      error,
      eventType,
      message: error.message,
    });
  }
}

/**
 * Worker pour envoyer les webhooks
 * À exécuter en arrière-plan (cron job ou Edge Function)
 */
export async function processWebhookQueue(): Promise<void> {
  try {
    const supabase = await createClient();

    // Récupérer les deliveries en attente
    const { data: deliveries, error } = await supabase
      .from('webhook_deliveries')
      .select(`
        *,
        webhook:webhook_endpoints (*)
      `)
      .in('status', ['pending', 'retrying'])
      .lte('next_retry_at', new Date().toISOString())
      .limit(50);

    if (error || !deliveries || deliveries.length === 0) {
      return;
    }

    logger.info('Processing webhook deliveries', {
      count: deliveries.length,
    });

    // Envoyer chaque webhook
    for (const delivery of deliveries) {
      await sendWebhook(delivery);
    }
  } catch (error: any) {
    logger.error('Process webhook queue error', {
      error,
      message: error.message,
    });
  }
}

/**
 * Envoyer un webhook individual
 */
async function sendWebhook(delivery: any): Promise<void> {
  const supabase = await createClient();

  try {
    const webhook = delivery.webhook;

    // Préparer la requête
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': delivery.signature,
        'X-Webhook-Event': delivery.event_type,
        'X-Webhook-ID': delivery.id,
        'User-Agent': 'Luneo-Webhook/1.0',
      },
      body: JSON.stringify(delivery.payload),
    });

    const responseBody = await response.text();

    // Mettre à jour le statut
    if (response.ok) {
      await supabase
        .from('webhook_deliveries')
        .update({
          status: 'success',
          response_code: response.status,
          response_body: responseBody.substring(0, 1000),
          delivered_at: new Date().toISOString(),
        })
        .eq('id', delivery.id);

      logger.info('Webhook delivered', {
        eventType: delivery.event_type,
        url: webhook.url,
        deliveryId: delivery.id,
      });
    } else {
      throw new Error(`HTTP ${response.status}: ${responseBody}`);
    }
  } catch (error: any) {
    // Gérer les échecs et retries
    const attempts = delivery.attempts + 1;
    const maxAttempts = delivery.max_attempts || 3;

    if (attempts >= maxAttempts) {
      // Échec définitif
      await supabase
        .from('webhook_deliveries')
        .update({
          status: 'failed',
          attempts,
          error_message: error.message,
        })
        .eq('id', delivery.id);

      logger.error('Webhook failed (max attempts)', {
        eventType: delivery.event_type,
        deliveryId: delivery.id,
        attempts,
        maxAttempts,
      });
    } else {
      // Programmer un retry
      const retryDelay = Math.pow(2, attempts) * 60 * 1000; // Exponential backoff
      const nextRetry = new Date(Date.now() + retryDelay);

      await supabase
        .from('webhook_deliveries')
        .update({
          status: 'retrying',
          attempts,
          error_message: error.message,
          next_retry_at: nextRetry.toISOString(),
        })
        .eq('id', delivery.id);

      logger.warn('Webhook retry scheduled', {
        eventType: delivery.event_type,
        deliveryId: delivery.id,
        attempts,
        maxAttempts,
        nextRetryAt: nextRetry.toISOString(),
      });
    }
  }
}

