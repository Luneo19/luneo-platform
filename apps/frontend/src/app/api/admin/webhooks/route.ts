/**
 * ★★★ ADMIN WEBHOOKS API ★★★
 * API route pour gérer les webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { serverLogger } from '@/lib/logger-server';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');

    const where: any = {};
    if (status) where.status = status;
    if (eventType) where.eventTypes = { has: eventType };

    const webhooks = await db.webhook.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { logs: true },
        },
      },
    });

    return NextResponse.json({ webhooks });
  } catch (error) {
    serverLogger.apiError('/api/admin/webhooks', 'GET', error, 500);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { url, eventTypes, secret, description } = body;

    if (!url || !eventTypes || !Array.isArray(eventTypes) || eventTypes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: url, eventTypes' },
        { status: 400 }
      );
    }

    // Générer un secret si non fourni
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

    const webhook = await db.webhook.create({
      data: {
        url,
        eventTypes,
        secret: webhookSecret,
        description: description || null,
        status: 'active',
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    serverLogger.apiError('/api/admin/webhooks', 'POST', error, 500);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}
