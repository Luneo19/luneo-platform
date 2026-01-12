/**
 * ★★★ OAUTH HELPERS ★★★
 * Helpers pour gérer l'OAuth des plateformes Ads
 */

export interface OAuthConfig {
  name: string;
  icon: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  requiredEnvVars: string[];
}

export const adsPlatforms: Record<string, OAuthConfig> = {
  meta: {
    name: 'Meta Ads',
    icon: 'meta',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: ['ads_read', 'ads_management', 'business_management'],
    requiredEnvVars: ['META_APP_ID', 'META_APP_SECRET'],
  },
  google: {
    name: 'Google Ads',
    icon: 'google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/adwords'],
    requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  },
  tiktok: {
    name: 'TikTok Ads',
    icon: 'tiktok',
    authUrl: 'https://business-api.tiktok.com/portal/auth',
    tokenUrl: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
    scopes: ['ad_account_info', 'ad_read', 'ad_performance'],
    requiredEnvVars: ['TIKTOK_APP_ID', 'TIKTOK_APP_SECRET'],
  },
};

export function getOAuthUrl(platform: string, redirectUri: string): string {
  const config = adsPlatforms[platform];
  if (!config) {
    throw new Error(`Platform ${platform} not found`);
  }

  const params = new URLSearchParams({
    client_id: process.env[config.requiredEnvVars[0]] || '',
    redirect_uri: redirectUri,
    scope: config.scopes.join(','),
    response_type: 'code',
  });

  return `${config.authUrl}?${params.toString()}`;
}

export function exchangeCodeForToken(
  platform: string,
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
  const config = adsPlatforms[platform];
  if (!config) {
    throw new Error(`Platform ${platform} not found`);
  }

  const clientId = process.env[config.requiredEnvVars[0]] || '';
  const clientSecret = process.env[config.requiredEnvVars[1]] || '';

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  return fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  }).then((res) => res.json());
}
