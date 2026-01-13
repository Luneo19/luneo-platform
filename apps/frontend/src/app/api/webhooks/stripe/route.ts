/**
 * Stripe Webhook Handler
 * Forward les webhooks Stripe vers le backend NestJS
 * Backend: POST /billing/webhook
 */

import { NextRequest } from 'next/server';
import { forwardWebhookToBackend } from '@/lib/backend-webhook-forward';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return forwardWebhookToBackend(
    '/billing/webhook',
    request,
    ['stripe-signature']
  );
}

/**
 * @deprecated Old implementation - now forwards to backend
 * 
 * NOTE: Old code removed to avoid TypeScript errors
 * Original implementation moved to backend NestJS
 * See: backend/src/modules/billing/billing.service.ts
 */
