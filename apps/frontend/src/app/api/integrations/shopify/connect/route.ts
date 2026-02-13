import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api/server-url';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop') || '';
  const backendUrl = getBackendUrl();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  // Build the backend auth URL with shop param
  const authUrl = new URL(`${backendUrl}/api/v1/integrations/shopify/auth`);
  if (shop) authUrl.searchParams.set('shop', shop);

  // If we have an access token, redirect with it
  if (accessToken) {
    authUrl.searchParams.set('token', accessToken);
  }

  return NextResponse.redirect(authUrl.toString());
}
