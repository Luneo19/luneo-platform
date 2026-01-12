/**
 * ★★★ META ADS INSIGHTS API ★★★
 * API route pour récupérer les insights Meta Ads
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { MetaAdsClient } from '@/lib/admin/integrations/meta-ads';
import { db } from '@/lib/db';
import { subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // Vérification admin
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const days = parseInt(searchParams.get('days') || '30');
    const level = searchParams.get('level') || 'account';

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId' },
        { status: 400 }
      );
    }

    // Récupérer la connexion
    const connection = await db.adPlatformConnection.findUnique({
      where: {
        platform_accountId: {
          platform: 'meta',
          accountId,
        },
      },
    });

    if (!connection || !connection.accessToken) {
      return NextResponse.json(
        { error: 'Meta Ads account not connected' },
        { status: 404 }
      );
    }

    // Créer le client
    const client = new MetaAdsClient(connection.accessToken, accountId);

    // Calculer les dates
    const dateTo = new Date().toISOString().split('T')[0];
    const dateFrom = subDays(new Date(), days).toISOString().split('T')[0];

    // Récupérer les insights
    const insights = await client.getInsights({
      dateFrom,
      dateTo,
      level: level as 'account' | 'campaign' | 'adset' | 'ad',
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error fetching Meta insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
