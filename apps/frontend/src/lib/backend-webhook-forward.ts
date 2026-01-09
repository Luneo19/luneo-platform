/**
 * ★★★ HELPER - WEBHOOK FORWARD ★★★
 * Helper spécialisé pour forwarder les webhooks vers le backend NestJS
 * 
 * Différences avec forwardToBackend:
 * - Pas d'authentification (webhooks externes)
 * - Raw body pour vérification de signature
 * - Headers originaux préservés
 */

import { logger } from '@/lib/logger';
import type { NextRequest } from 'next/server';

/**
 * Configuration du backend
 */
const getBackendUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
  // S'assurer que l'URL se termine correctement
  if (url.includes('api.luneo.app') || url.includes('localhost:3001')) {
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  return url;
};

/**
 * Forward un webhook vers le backend NestJS
 * 
 * @param endpoint - Endpoint backend (ex: '/billing/webhook')
 * @param request - Requête Next.js originale
 * @param preserveHeaders - Headers à préserver (ex: ['stripe-signature', 'x-shopify-hmac-sha256'])
 * @returns Réponse du backend
 */
export async function forwardWebhookToBackend(
  endpoint: string,
  request: NextRequest,
  preserveHeaders: string[] = []
): Promise<Response> {
  try {
    const backendUrl = getBackendUrl();
    const url = new URL(`${backendUrl}${endpoint}`);

    // Récupérer le raw body (non parsé)
    const rawBody = await request.text();

    // Préparer les headers
    const headers: Record<string, string> = {};

    // Préserver les headers spécifiques (pour vérification de signature)
    preserveHeaders.forEach(headerName => {
      const headerValue = request.headers.get(headerName);
      if (headerValue) {
        headers[headerName] = headerValue;
      }
    });

    // Préserver aussi les headers standards de webhook
    const standardWebhookHeaders = [
      'stripe-signature',
      'x-shopify-topic',
      'x-shopify-shop-domain',
      'x-shopify-hmac-sha256',
      'x-wc-webhook-topic',
      'x-wc-webhook-signature',
      'x-wc-webhook-source',
      'x-wc-webhook-delivery-id',
      'content-type',
    ];

    standardWebhookHeaders.forEach(headerName => {
      const headerValue = request.headers.get(headerName);
      if (headerValue && !headers[headerName.toLowerCase()]) {
        headers[headerName.toLowerCase()] = headerValue;
      }
    });

    // S'assurer que Content-Type est présent si body existe
    if (rawBody && !headers['content-type']) {
      headers['content-type'] = 'application/json';
    }

    logger.info('Forwarding webhook to backend', {
      endpoint,
      url: url.toString(),
      headers: Object.keys(headers),
      bodyLength: rawBody.length,
    });

    // Forwarder la requête
    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body: rawBody || undefined,
    });

    // Retourner la réponse telle quelle
    const responseText = await response.text();
    
    logger.info('Webhook forwarded', {
      endpoint,
      status: response.status,
      statusText: response.statusText,
    });

    return new Response(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    logger.error('Failed to forward webhook to backend', {
      endpoint,
      error: error instanceof Error ? error.message : String(error),
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to forward webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
