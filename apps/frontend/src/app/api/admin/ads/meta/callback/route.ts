/**
 * ★★★ META ADS CALLBACK API ★★★
 * API route pour traiter le callback OAuth Meta
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { exchangeCodeForToken } from '@/lib/admin/integrations/oauth-helpers';
import { db } from '@/lib/db';

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
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Peut contenir l'adAccountId
    const redirectUri = `${request.nextUrl.origin}/admin/ads/meta/callback`;

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    // Échanger le code contre un token
    const tokenData = await exchangeCodeForToken('meta', code, redirectUri);

    // Récupérer les infos du compte depuis Meta
    const accountResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${tokenData.access_token}`
    );
    const accountData = await accountResponse.json();

    const adAccountId = state || accountData.data?.[0]?.account_id || '';

    // Sauvegarder la connexion dans la base de données
    const connection = await db.adPlatformConnection.upsert({
      where: {
        platform_accountId: {
          platform: 'meta',
          accountId: adAccountId,
        },
      },
      create: {
        platform: 'meta',
        accountId: adAccountId,
        accountName: accountData.data?.[0]?.name || 'Meta Ads Account',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        expiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        metadata: {
          scopes: ['ads_read', 'ads_management'],
        },
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || undefined,
        expiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : undefined,
        lastSyncedAt: new Date(),
      },
    });

    // Rediriger vers la page Meta Ads
    return NextResponse.redirect(new URL('/admin/ads/meta?connected=true', request.url));
  } catch (error) {
    console.error('Error processing Meta OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/admin/ads/meta?error=connection_failed', request.url)
    );
  }
}
