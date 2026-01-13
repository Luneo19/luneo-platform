/**
 * Shopify Webhook Handler
 * Forward les webhooks Shopify vers le backend NestJS
 * Backend: POST /ecommerce/shopify/webhook
 */

import { NextRequest } from 'next/server';
import { forwardWebhookToBackend } from '@/lib/backend-webhook-forward';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return forwardWebhookToBackend(
    '/ecommerce/shopify/webhook',
    request,
    [
      'x-shopify-topic',
      'x-shopify-shop-domain',
      'x-shopify-hmac-sha256',
    ]
  );
}

/**
 * @deprecated Old implementation - now forwards to backend
 * 
 * NOTE: Old code removed to avoid TypeScript errors
 * Original implementation moved to backend NestJS
 * See: backend/src/modules/integrations/shopify/shopify.service.ts
 */
