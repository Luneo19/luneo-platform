'use client';

let sessionRecoveryPromise: Promise<boolean> | null = null;

async function fetchMe(): Promise<Response> {
  return fetch('/api/v1/auth/me', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
}

async function refreshSession(): Promise<Response> {
  return fetch('/api/v1/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

/**
 * Ensures only one refresh flow runs at a time in the browser.
 * Returns true when a valid session is available after recovery.
 */
export async function ensureSession(): Promise<boolean> {
  if (!sessionRecoveryPromise) {
    sessionRecoveryPromise = (async () => {
      const meResp = await fetchMe();
      if (meResp.ok) return true;
      if (meResp.status !== 401) return false;

      const refreshResp = await refreshSession();
      if (!refreshResp.ok) return false;

      const retryMeResp = await fetchMe();
      return retryMeResp.ok;
    })().finally(() => {
      sessionRecoveryPromise = null;
    });
  }

  return sessionRecoveryPromise;
}
