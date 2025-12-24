/**
 * Webhook Service
 * Gère l'envoi de notifications vers des webhooks externes
 */

import { logger } from '@/lib/logger';

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
  user_id?: string;
  resource_type?: string;
  resource_id?: string;
}

interface WebhookConfig {
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
}

export class WebhookService {
  /**
   * Envoie une notification vers un webhook externe
   */
  static async sendWebhook(
    config: WebhookConfig,
    payload: WebhookPayload
  ): Promise<{ success: boolean; error?: string }> {
    if (!config.active || !config.url) {
      return { success: false, error: 'Webhook désactivé ou URL manquante' };
    }

    // Vérifier si l'événement est dans la liste des événements autorisés
    if (!config.events.includes(payload.event) && !config.events.includes('*')) {
      return { success: false, error: 'Événement non autorisé' };
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'User-Agent': 'Luneo-Platform/1.0',
      };

      // Ajouter la signature si un secret est configuré
      if (config.secret) {
        const signature = await this.generateSignature(JSON.stringify(payload), config.secret);
        headers['X-Luneo-Signature'] = signature;
        headers['X-Luneo-Timestamp'] = payload.timestamp;
      }

      const response = await fetch(config.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        // Timeout de 10 secondes
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Webhook failed: ${response.status} ${errorText}`);
      }

      return { success: true };
    } catch (error: any) {
      logger.error('Erreur envoi webhook', {
        error,
        url: config.url,
        event: payload.event,
        message: error.message || 'Erreur lors de l\'envoi du webhook',
      });
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi du webhook',
      };
    }
  }

  /**
   * Génère une signature HMAC pour sécuriser le webhook
   */
  private static async generateSignature(
    payload: string,
    secret: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Envoie une notification vers plusieurs webhooks
   */
  static async sendToMultipleWebhooks(
    configs: WebhookConfig[],
    payload: WebhookPayload
  ): Promise<Array<{ config: WebhookConfig; result: { success: boolean; error?: string } }>> {
    const results = await Promise.allSettled(
      configs.map(async (config) => ({
        config,
        result: await this.sendWebhook(config, payload),
      }))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          config: configs[index],
          result: {
            success: false,
            error: result.reason?.message || 'Erreur inconnue',
          },
        };
      }
    });
  }

  /**
   * Valide une signature de webhook reçue
   */
  static async validateSignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp: string
  ): Promise<boolean> {
    // Vérifier que le timestamp n'est pas trop ancien (5 minutes)
    const payloadTimestamp = parseInt(timestamp, 10);
    const now = Date.now();
    if (Math.abs(now - payloadTimestamp) > 5 * 60 * 1000) {
      return false;
    }

    const expectedSignature = await this.generateSignature(payload, secret);
    return signature === expectedSignature;
  }
}

