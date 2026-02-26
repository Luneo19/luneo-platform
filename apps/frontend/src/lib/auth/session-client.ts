'use client';

let sessionRecoveryPromise: Promise<boolean> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchMe(): Promise<Response> {
  return fetch('/api/v1/auth/me', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
}

async function refreshSession(): Promise<Response> {
  const csrfToken =
    typeof document !== 'undefined'
      ? document.cookie
          .split('; ')
          .find((cookie) => cookie.startsWith('csrf_token='))
          ?.split('=')[1]
      : undefined;

  return fetch('/api/v1/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': decodeURIComponent(csrfToken) } : {}),
    },
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
      let meResp: Response;
      try {
        meResp = await fetchMe();
      } catch {
        // Transient network hiccup: short retry before declaring session lost.
        await sleep(250);
        try {
          meResp = await fetchMe();
        } catch {
          return false;
        }
      }

      if (meResp.ok) return true;
      if (meResp.status !== 401) return false;

      let refreshResp: Response;
      try {
        refreshResp = await refreshSession();
      } catch {
        await sleep(250);
        try {
          refreshResp = await refreshSession();
        } catch {
          return false;
        }
      }
      if (!refreshResp.ok) return false;

      let retryMeResp: Response;
      try {
        retryMeResp = await fetchMe();
      } catch {
        return false;
      }
      return retryMeResp.ok;
    })().finally(() => {
      sessionRecoveryPromise = null;
    });
  }

  return sessionRecoveryPromise;
}
