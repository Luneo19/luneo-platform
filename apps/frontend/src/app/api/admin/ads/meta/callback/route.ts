/**
 * ★★★ META ADS CALLBACK API ★★★
 * Forwards to NestJS backend. Backend performs OAuth exchange and DB upsert, then returns redirect URL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { serverLogger } from '@/lib/logger-server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function forwardHeaders(request: NextRequest): HeadersInit {
  const headers: HeadersInit = {
    Cookie: request.headers.get('cookie') || '',
  };
  const auth = request.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const url = new URL(`${API_URL}/api/v1/admin/ads/meta/callback`);
    url.searchParams.set('code', searchParams.get('code') || '');
    url.searchParams.set('state', searchParams.get('state') || '');
    const redirectUri = `${request.nextUrl.origin}/admin/ads/meta/callback`;
    url.searchParams.set('redirect_uri', redirectUri);

    const res = await fetch(url.toString(), { headers: forwardHeaders(request), redirect: 'manual' });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      return NextResponse.redirect(new URL(res.headers.get('location')!, request.url));
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.redirect(new URL('/admin/ads/meta?error=connection_failed', request.url));
    }
    return NextResponse.redirect(new URL(data.redirectUrl || '/admin/ads/meta?connected=true', request.url));
  } catch (error) {
    serverLogger.apiError('/api/admin/ads/meta/callback', 'GET', error);
    return NextResponse.redirect(new URL('/admin/ads/meta?error=connection_failed', request.url));
  }
}
