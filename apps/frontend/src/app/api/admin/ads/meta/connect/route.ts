/**
 * ★★★ META ADS CONNECT API ★★★
 * API route pour initier la connexion OAuth Meta
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { getOAuthUrl } from '@/lib/admin/integrations/oauth-helpers';
import { isMetaAdsConfigured } from '@/lib/admin/integrations/meta-ads';
import { serverLogger } from '@/lib/logger-server';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!isMetaAdsConfigured()) {
      return NextResponse.json(
        {
          error: 'Meta Ads is not configured. Set META_APP_ID and META_APP_SECRET in the environment.',
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const redirectUri = searchParams.get('redirect_uri') || `${request.nextUrl.origin}/admin/ads/meta/callback`;

    const oauthUrl = getOAuthUrl('meta', redirectUri);

    return NextResponse.json({
      oauthUrl,
      redirectUri,
    });
  } catch (error) {
    serverLogger.apiError('/api/admin/ads/meta/connect', 'GET', error, 500);
    return NextResponse.json(
      { error: 'Failed to generate OAuth URL' },
      { status: 500 }
    );
  }
}
