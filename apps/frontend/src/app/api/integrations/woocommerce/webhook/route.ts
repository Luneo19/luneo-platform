/**
 * WooCommerce Webhook Handler
 * Forward les webhooks WooCommerce vers le backend NestJS
 * Backend: POST /ecommerce/woocommerce/webhook
 */

import { NextRequest } from 'next/server';
import { forwardWebhookToBackend } from '@/lib/backend-webhook-forward';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return forwardWebhookToBackend(
    '/ecommerce/woocommerce/webhook',
    request,
    [
      'x-wc-webhook-topic',
      'x-wc-webhook-signature',
      'x-wc-webhook-source',
      'x-wc-webhook-delivery-id',
    ]
  );
}

/**
 * @deprecated Old implementation - now forwards to backend
 * 
 * NOTE: Old code removed to avoid TypeScript errors
 * Original implementation moved to backend NestJS
 * See: backend/src/modules/integrations/woocommerce/woocommerce.service.ts
 */
