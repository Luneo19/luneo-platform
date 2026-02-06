/**
 * ★★★ ADMIN WEBHOOK TEST API ★★★
 * API route pour tester un webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { serverLogger } from '@/lib/logger-server';

export async function POST(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { webhookId } = params;
    const body = await request.json();

    const webhook = await db.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Créer un payload de test
    const testPayload = body.payload || {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: { message: 'Test webhook from Luneo Admin' },
    };

    // Calculer la signature HMAC
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(testPayload))
      .digest('hex');

    // Envoyer le webhook
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': 'webhook.test',
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();

    // Logger le résultat
    await db.webhookLog.create({
      data: {
        webhookId: webhook.id,
        status: response.ok ? 'success' : 'failed',
        responseCode: response.status,
        responseBody: responseText.substring(0, 1000), // Limiter la taille
        payload: testPayload,
      },
    });

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: responseText.substring(0, 500),
    });
  } catch (error) {
    serverLogger.apiError('/api/admin/webhooks/[webhookId]/test', 'POST', error, 500);
    return NextResponse.json({ error: 'Failed to test webhook' }, { status: 500 });
  }
}
