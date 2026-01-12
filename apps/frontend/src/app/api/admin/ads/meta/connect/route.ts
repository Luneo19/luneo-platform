/**
 * ★★★ META ADS CONNECT API ★★★
 * API route pour initier la connexion OAuth Meta
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { getOAuthUrl } from '@/lib/admin/integrations/oauth-helpers';

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
    const redirectUri = searchParams.get('redirect_uri') || `${request.nextUrl.origin}/admin/ads/meta/callback`;

    // Générer l'URL OAuth
    const oauthUrl = getOAuthUrl('meta', redirectUri);

    return NextResponse.json({
      oauthUrl,
      redirectUri,
    });
  } catch (error) {
    console.error('Error generating Meta OAuth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate OAuth URL' },
      { status: 500 }
    );
  }
}
