/**
 * ★★★ ADMIN WEBHOOK DETAIL API ★★★
 * API route pour gérer un webhook spécifique
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { db } from '@/lib/db';
import { serverLogger } from '@/lib/logger-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { webhookId } = params;

    const webhook = await db.webhook.findUnique({
      where: { id: webhookId },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: {
          select: { logs: true },
        },
      },
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json({ webhook });
  } catch (error) {
    serverLogger.apiError(`/api/admin/webhooks/${params.webhookId}`, 'GET', error);
    return NextResponse.json({ error: 'Failed to fetch webhook' }, { status: 500 });
  }
}

export async function PATCH(
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

    const webhook = await db.webhook.update({
      where: { id: webhookId },
      data: {
        url: body.url,
        eventTypes: body.eventTypes,
        status: body.status,
        description: body.description,
      },
    });

    return NextResponse.json({ webhook });
  } catch (error) {
    serverLogger.apiError(`/api/admin/webhooks/${params.webhookId}`, 'PATCH', error);
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { webhookId } = params;

    await db.webhook.delete({
      where: { id: webhookId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    serverLogger.apiError(`/api/admin/webhooks/${params.webhookId}`, 'DELETE', error);
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }
}
