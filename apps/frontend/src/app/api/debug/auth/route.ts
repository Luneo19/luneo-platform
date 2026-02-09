/**
 * TEMPORARY DEBUG ROUTE — Remove after fixing admin auth
 * Tests the server-side auth flow step by step
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

export async function GET(request: NextRequest) {
  const debug: Record<string, unknown> = {};

  try {
    // Step 1: Read cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;
    
    debug.step1_cookies = {
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length || 0,
      accessTokenPrefix: accessToken?.substring(0, 20) || 'NONE',
      hasRefreshToken: !!refreshToken,
      refreshTokenLength: refreshToken?.length || 0,
    };

    // Also check raw cookie header
    const rawCookie = request.headers.get('cookie');
    debug.step1_rawCookie = {
      hasRawCookie: !!rawCookie,
      rawCookieLength: rawCookie?.length || 0,
      containsAccessToken: rawCookie?.includes('accessToken=') || false,
      containsRefreshToken: rawCookie?.includes('refreshToken=') || false,
    };

    if (!accessToken) {
      debug.result = 'NO_ACCESS_TOKEN';
      return NextResponse.json(debug);
    }

    // Step 2: Build backend URL
    const backendUrl = getBackendUrl();
    debug.step2_backendUrl = backendUrl;
    debug.step2_backendUrlTrimmed = backendUrl.trim();
    debug.step2_hasWhitespace = backendUrl !== backendUrl.trim();

    // Step 3: Call backend /auth/me
    const cookieHeader = refreshToken
      ? `accessToken=${accessToken}; refreshToken=${refreshToken}`
      : `accessToken=${accessToken}`;
    
    const fullUrl = `${backendUrl.trim()}/api/v1/auth/me`;
    debug.step3_fullUrl = fullUrl;

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    debug.step3_status = response.status;
    debug.step3_ok = response.ok;
    debug.step3_statusText = response.statusText;

    // Step 4: Parse response
    const responseText = await response.text();
    debug.step4_responseLength = responseText.length;
    debug.step4_responsePrefix = responseText.substring(0, 300);

    try {
      const data = JSON.parse(responseText);
      debug.step4_parsed = true;
      debug.step4_topLevelKeys = Object.keys(data);
      debug.step4_hasData = !!data.data;
      debug.step4_hasId = !!data.id;
      debug.step4_hasDataId = !!data.data?.id;

      // Apply the fix logic
      const user = data?.data || data;
      debug.step5_unwrapped = {
        hasId: !!user.id,
        id: user.id?.substring?.(0, 10) || 'NONE',
        email: user.email || 'NONE',
        role: user.role || 'NONE',
      };
    } catch {
      debug.step4_parsed = false;
      debug.step4_parseError = 'Failed to parse JSON';
    }

    debug.result = 'COMPLETE';
  } catch (error) {
    debug.error = error instanceof Error ? error.message : String(error);
    debug.result = 'ERROR';
  }

  return NextResponse.json(debug);
}
