/**
 * ★★★ ADMIN EVENTS API ★★★
 * API route pour récupérer tous les événements système
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { db } from '@/lib/db';
import { subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');

    const dateFrom = subDays(new Date(), days);

    const where: any = {
      createdAt: {
        gte: dateFrom,
      },
    };

    if (type) {
      where.type = type;
    }

    const events = await db.event.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      events: events.map((e: any) => ({
        id: e.id,
        type: e.type,
        data: e.data || {},
        customerId: e.customerId,
        createdAt: e.createdAt,
      })),
      total: events.length,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
