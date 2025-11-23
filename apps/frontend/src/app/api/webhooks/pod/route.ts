import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * POST /api/webhooks/pod
 * Webhook pour les services Print-on-Demand (POD)
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    // Récupérer les headers
    const signature = request.headers.get('x-pod-signature');
    const webhookId = request.headers.get('x-pod-webhook-id');
    const provider = request.headers.get('x-pod-provider') || 'unknown';

    // Récupérer le body
    const body = await request.text();
    let bodyJson: any;

    try {
      bodyJson = JSON.parse(body);
    } catch (parseError) {
      throw {
        status: 400,
        message: 'Body JSON invalide',
        code: 'VALIDATION_ERROR',
      };
    }

    logger.info('POD webhook received', {
      provider,
      webhookId,
      hasSignature: !!signature,
      eventType: bodyJson.event_type || bodyJson.type || 'unknown',
    });

    // Vérifier la signature si fournie
    if (signature && process.env.POD_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.POD_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('Invalid POD webhook signature', {
          provider,
          webhookId,
        });
        throw {
          status: 401,
          message: 'Signature invalide',
          code: 'INVALID_SIGNATURE',
        };
      }
    }

    // Enregistrer le webhook
    const { data: webhookRecord, error: insertError } = await supabase
      .from('webhook_logs')
      .insert({
        source: `pod_${provider}`,
        webhook_id: webhookId || null,
        payload: bodyJson,
        signature: signature || null,
        received_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      logger.dbError('log POD webhook', insertError, {
        provider,
        webhookId,
      });
      // Ne pas échouer si l'enregistrement échoue, juste logger
    }

    // Traiter le webhook selon le provider et le type d'événement
    let processed = false;
    let result: any = null;

    try {
      const eventType = bodyJson.event_type || bodyJson.type || 'unknown';

      switch (provider.toLowerCase()) {
        case 'printful':
          result = await processPrintfulWebhook(bodyJson, eventType);
          processed = true;
          break;

        case 'printify':
          result = await processPrintifyWebhook(bodyJson, eventType);
          processed = true;
          break;

        case 'gelato':
          result = await processGelatoWebhook(bodyJson, eventType);
          processed = true;
          break;

        default:
          logger.warn('Unknown POD provider', {
            provider,
            webhookId,
          });
          result = { message: 'Provider POD inconnu' };
      }
    } catch (processError: any) {
      logger.error('POD webhook processing error', processError, {
        provider,
        webhookId,
        eventType: bodyJson.event_type || bodyJson.type,
      });
      throw {
        status: 500,
        message: 'Erreur lors du traitement du webhook POD',
        code: 'WEBHOOK_PROCESSING_ERROR',
      };
    }

    // Mettre à jour le log du webhook
    if (webhookRecord) {
      await supabase
        .from('webhook_logs')
        .update({
          processed: processed,
          processed_at: processed ? new Date().toISOString() : null,
          result: result || null,
        })
        .eq('id', webhookRecord.id)
        .catch((updateError) => {
          logger.warn('Failed to update POD webhook log', {
            webhookId: webhookRecord.id,
            error: updateError,
          });
        });
    }

    logger.info('POD webhook processed', {
      provider,
      webhookId,
      processed,
    });

    return {
      success: true,
      processed,
      result,
      message: processed ? 'Webhook POD traité avec succès' : 'Webhook reçu mais non traité',
    };
  }, '/api/webhooks/pod', 'POST');
}

/**
 * Traite un webhook Printful
 */
async function processPrintfulWebhook(payload: any, eventType: string): Promise<any> {
  logger.debug('Processing Printful webhook', {
    eventType,
    orderId: payload.order?.id,
  });

  // Mettre à jour le statut de la commande si nécessaire
  if (payload.order?.id) {
    const supabase = await createClient();
    await supabase
      .from('orders')
      .update({
        status: mapPrintfulStatus(payload.order.status),
        updated_at: new Date().toISOString(),
        metadata: {
          ...payload.order,
          pod_provider: 'printful',
          pod_event: eventType,
        },
      })
      .eq('external_id', payload.order.id.toString())
      .catch((updateError) => {
        logger.warn('Failed to update order from Printful webhook', {
          orderId: payload.order.id,
          error: updateError,
        });
      });
  }

  return {
    message: 'Webhook Printful traité',
    eventType,
    orderId: payload.order?.id,
  };
}

/**
 * Traite un webhook Printify
 */
async function processPrintifyWebhook(payload: any, eventType: string): Promise<any> {
  logger.debug('Processing Printify webhook', {
    eventType,
    orderId: payload.order?.id,
  });

  // Mettre à jour le statut de la commande si nécessaire
  if (payload.order?.id) {
    const supabase = await createClient();
    await supabase
      .from('orders')
      .update({
        status: mapPrintifyStatus(payload.order.status),
        updated_at: new Date().toISOString(),
        metadata: {
          ...payload.order,
          pod_provider: 'printify',
          pod_event: eventType,
        },
      })
      .eq('external_id', payload.order.id.toString())
      .catch((updateError) => {
        logger.warn('Failed to update order from Printify webhook', {
          orderId: payload.order.id,
          error: updateError,
        });
      });
  }

  return {
    message: 'Webhook Printify traité',
    eventType,
    orderId: payload.order?.id,
  };
}

/**
 * Traite un webhook Gelato
 */
async function processGelatoWebhook(payload: any, eventType: string): Promise<any> {
  logger.debug('Processing Gelato webhook', {
    eventType,
    orderId: payload.orderId || payload.order?.id,
  });

  // Mettre à jour le statut de la commande si nécessaire
  const orderId = payload.orderId || payload.order?.id;
  if (orderId) {
    const supabase = await createClient();
    await supabase
      .from('orders')
      .update({
        status: mapGelatoStatus(payload.status || payload.order?.status),
        updated_at: new Date().toISOString(),
        metadata: {
          ...payload,
          pod_provider: 'gelato',
          pod_event: eventType,
        },
      })
      .eq('external_id', orderId.toString())
      .catch((updateError) => {
        logger.warn('Failed to update order from Gelato webhook', {
          orderId,
          error: updateError,
        });
      });
  }

  return {
    message: 'Webhook Gelato traité',
    eventType,
    orderId,
  };
}

/**
 * Mappe le statut Printful vers le statut interne
 */
function mapPrintfulStatus(printfulStatus: string): string {
  const statusMap: Record<string, string> = {
    draft: 'pending',
    pending: 'pending',
    failed: 'failed',
    canceled: 'cancelled',
    inprocess: 'processing',
    partial: 'processing',
    fulfilled: 'completed',
    returned: 'returned',
  };

  return statusMap[printfulStatus.toLowerCase()] || 'pending';
}

/**
 * Mappe le statut Printify vers le statut interne
 */
function mapPrintifyStatus(printifyStatus: string): string {
  const statusMap: Record<string, string> = {
    pending: 'pending',
    on_hold: 'pending',
    in_production: 'processing',
    partial: 'processing',
    shipped: 'shipped',
    fulfilled: 'completed',
    canceled: 'cancelled',
  };

  return statusMap[printifyStatus.toLowerCase()] || 'pending';
}

/**
 * Mappe le statut Gelato vers le statut interne
 */
function mapGelatoStatus(gelatoStatus: string): string {
  const statusMap: Record<string, string> = {
    draft: 'pending',
    pending: 'pending',
    in_progress: 'processing',
    shipped: 'shipped',
    delivered: 'completed',
    cancelled: 'cancelled',
  };

  return statusMap[gelatoStatus.toLowerCase()] || 'pending';
}
