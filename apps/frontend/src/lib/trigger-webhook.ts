/**
 * TRIGGER WEBHOOKS
 * Déclencher les webhooks sortants pour notifier les clients.
 * Migration complete: trigger and queue are delegated to backend /api/v1/webhooks/trigger.
 */

import { logger } from '@/lib/logger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    const response = await fetch(`${API_URL}/api/v1/webhooks/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        payload,
      }),
    });

    if (response.ok) {
      logger.info('Webhook triggered via backend', {
        eventType,
        payloadKeys: Object.keys(payload),
      });
      return;
    }

    logger.warn('Webhook trigger returned non-OK', {
      eventType,
      status: response.status,
      payloadKeys: Object.keys(payload),
    });
  } catch (error: any) {
    logger.warn('Backend webhook endpoint not available', {
      eventType,
      error,
      message: error?.message,
    });
  }
}

/**
 * Worker pour envoyer les webhooks.
 * Queue processing is handled by backend; this frontend helper only forwards trigger requests to /api/v1/webhooks/trigger.
 */
export async function processWebhookQueue(): Promise<void> {
  try {
    // Webhook queue processing is handled by backend worker/queue system
    logger.info('Webhook queue processing is delegated to backend');
  } catch (error: any) {
    logger.error('Process webhook queue error', {
      error,
      message: error.message,
    });
  }
}

