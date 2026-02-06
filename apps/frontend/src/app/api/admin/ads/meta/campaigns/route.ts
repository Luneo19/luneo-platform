/**
 * ★★★ META ADS CAMPAIGNS API ★★★
 * API route pour récupérer les campagnes Meta
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { MetaAdsClient } from '@/lib/admin/integrations/meta-ads';
import { db } from '@/lib/db';
import { serverLogger } from '@/lib/logger-server';

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
    const status = searchParams.get('status');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId' },
        { status: 400 }
      );
    }

    // Récupérer la connexion depuis la base de données
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

    // Créer le client Meta Ads
    const client = new MetaAdsClient(connection.accessToken, accountId);

    // Récupérer les campagnes
    const campaigns = await client.getCampaigns({
      status: status || undefined,
      limit: 100,
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    serverLogger.apiError('/api/admin/ads/meta/campaigns', 'GET', error, 500);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
