/**
 * TEMPORARY DEBUG PAGE — Remove after fixing admin auth
 * Tests the server-side auth flow step by step and displays results
 */
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

export const dynamic = 'force-dynamic';

export default async function DebugAuthPage() {
  const debug: Record<string, unknown> = {};

  try {
    // Step 1: Read cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;
    
    debug.step1_cookies = {
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length || 0,
      accessTokenPrefix: accessToken?.substring(0, 30) || 'NONE',
      hasRefreshToken: !!refreshToken,
      refreshTokenLength: refreshToken?.length || 0,
    };

    if (!accessToken) {
      debug.result = 'NO_ACCESS_TOKEN';
      return <pre>{JSON.stringify(debug, null, 2)}</pre>;
    }

    // Step 2: Build backend URL
    const backendUrl = getBackendUrl();
    debug.step2_backendUrl = backendUrl;
    debug.step2_backendUrlLength = backendUrl.length;
    debug.step2_backendUrlCharCodes = [...backendUrl].slice(-5).map(c => c.charCodeAt(0));
    debug.step2_hasTrailingWhitespace = backendUrl !== backendUrl.trim();

    // Step 3: Call backend /auth/me
    const cookieHeader = refreshToken
      ? `accessToken=${accessToken}; refreshToken=${refreshToken}`
      : `accessToken=${accessToken}`;
    
    const fullUrl = `${backendUrl.trim()}/api/v1/auth/me`;
    debug.step3_fullUrl = fullUrl;

    const startTime = Date.now();
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    const elapsed = Date.now() - startTime;

    debug.step3_status = response.status;
    debug.step3_ok = response.ok;
    debug.step3_elapsed = `${elapsed}ms`;

    // Step 4: Parse response
    const responseText = await response.text();
    debug.step4_responseLength = responseText.length;
    debug.step4_responsePreview = responseText.substring(0, 500);

    try {
      const data = JSON.parse(responseText);
      debug.step4_topLevelKeys = Object.keys(data);
      debug.step4_hasSuccess = 'success' in data;
      debug.step4_hasData = 'data' in data;
      debug.step4_hasId = 'id' in data;
      
      if (data.data) {
        debug.step4_dataKeys = Object.keys(data.data);
        debug.step4_dataHasId = 'id' in data.data;
      }

      // Apply the fix logic
      const user = data?.data || data;
      debug.step5_fixResult = {
        hasId: !!user.id,
        id: user.id?.substring?.(0, 15) || 'NONE',
        email: user.email || 'NONE',
        role: user.role || 'NONE',
      };
      
      debug.result = user.id ? 'SUCCESS' : 'NO_USER_ID_AFTER_UNWRAP';
    } catch (e) {
      debug.step4_parseError = e instanceof Error ? e.message : String(e);
      debug.result = 'JSON_PARSE_ERROR';
    }
  } catch (error) {
    debug.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    debug.result = 'EXCEPTION';
  }

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px', background: '#111', color: '#0f0' }}>
      <h1>Server-Side Auth Debug</h1>
      <pre>{JSON.stringify(debug, null, 2)}</pre>
    </div>
  );
}
