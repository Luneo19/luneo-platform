/**
 * TEMPORARY DIAGNOSTIC PAGE - /admin-check
 * Performs the same auth checks as the Super Admin layout
 * but displays results instead of redirecting.
 * DELETE THIS FILE once the admin auth flow is confirmed working.
 */

import { cookies, headers } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

export const dynamic = 'force-dynamic';

export default async function AdminCheckPage() {
  const results: Record<string, unknown> = {};

  // Step 1: Read cookies
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;

    results.step1_cookies = {
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length || 0,
      accessTokenPrefix: accessToken?.substring(0, 20) || 'NONE',
      hasRefreshToken: !!refreshToken,
      refreshTokenLength: refreshToken?.length || 0,
    };

    // Step 2: Call backend /auth/me with cookies
    if (accessToken) {
      const backendUrl = getBackendUrl();
      const cookieHeader = refreshToken
        ? `accessToken=${accessToken}; refreshToken=${refreshToken}`
        : `accessToken=${accessToken}`;

      results.step2_backendUrl = backendUrl;
      results.step2_cookieHeader = cookieHeader.substring(0, 50) + '...';

      try {
        const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
          method: 'GET',
          headers: {
            Cookie: cookieHeader,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        results.step2_status = response.status;
        results.step2_statusText = response.statusText;

        if (response.ok) {
          const data = await response.json();
          results.step2_rawResponseKeys = Object.keys(data);
          results.step2_hasSuccessField = 'success' in data;
          results.step2_hasDataField = 'data' in data;

          // Unwrap response
          const user = data?.data || data;
          results.step3_unwrappedUser = {
            id: user?.id || 'MISSING',
            email: user?.email || 'MISSING',
            role: user?.role || 'MISSING',
            brandId: user?.brandId || null,
            hasId: !!user?.id,
          };

          // Step 3: Role check
          results.step4_isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';
          results.step4_verdict = user?.role === 'PLATFORM_ADMIN'
            ? 'ACCESS GRANTED - User is PLATFORM_ADMIN'
            : `ACCESS DENIED - Role is "${user?.role}" (expected PLATFORM_ADMIN)`;
        } else {
          const errorBody = await response.text().catch(() => 'Could not read body');
          results.step2_errorBody = errorBody.substring(0, 200);
        }
      } catch (fetchError) {
        results.step2_fetchError = fetchError instanceof Error ? fetchError.message : String(fetchError);
      }
    } else {
      results.step2_skipped = 'No accessToken cookie - backend call skipped';
    }

    // Step 4: Read raw cookie header from request
    const headerStore = await headers();
    const rawCookieHeader = headerStore.get('cookie');
    results.step5_rawCookieHeader = rawCookieHeader
      ? rawCookieHeader.substring(0, 100) + '...'
      : 'NO COOKIE HEADER';

  } catch (error) {
    results.globalError = error instanceof Error ? error.message : String(error);
  }

  // Step 5: Overall diagnosis
  const hasCookies = !!results.step1_cookies && (results.step1_cookies as Record<string, unknown>).hasAccessToken;
  const backendOk = results.step2_status === 200;
  const isAdmin = results.step4_isPlatformAdmin === true;

  let diagnosis = '';
  if (!hasCookies) {
    diagnosis = 'ECHEC: Aucun cookie accessToken. Le navigateur na pas stocke les cookies apres le login. Verifiez que les cookies tiers ne sont pas bloques.';
  } else if (!backendOk) {
    diagnosis = `ECHEC: Le backend a retourne HTTP ${results.step2_status}. Le token est peut-etre expire ou invalide.`;
  } else if (!isAdmin) {
    diagnosis = `ECHEC: L utilisateur n a pas le role PLATFORM_ADMIN. Role actuel: ${(results.step3_unwrappedUser as Record<string, unknown>)?.role || 'inconnu'}`;
  } else {
    diagnosis = 'SUCCES: Tout est correct. L utilisateur devrait pouvoir acceder a /admin.';
  }

  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem', background: '#0a0a0a', color: '#e0e0e0', minHeight: '100vh' }}>
      <h1 style={{ color: '#4ade80', marginBottom: '1rem' }}>Admin Auth Diagnostic - /admin-check</h1>
      
      <div style={{
        padding: '1rem',
        marginBottom: '1.5rem',
        borderRadius: '8px',
        background: isAdmin ? '#052e16' : '#450a0a',
        border: `1px solid ${isAdmin ? '#16a34a' : '#dc2626'}`,
      }}>
        <strong>DIAGNOSTIC:</strong> {diagnosis}
      </div>

      <pre style={{
        background: '#1a1a2e',
        padding: '1.5rem',
        borderRadius: '8px',
        overflow: 'auto',
        fontSize: '13px',
        lineHeight: '1.6',
      }}>
        {JSON.stringify(results, null, 2)}
      </pre>

      <p style={{ marginTop: '1rem', color: '#888', fontSize: '12px' }}>
        Page temporaire de diagnostic. Supprimer apps/frontend/src/app/admin-check/page.tsx une fois le probleme resolu.
      </p>
    </div>
  );
}
