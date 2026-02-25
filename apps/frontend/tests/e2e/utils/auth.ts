import { Page, APIResponse } from '@playwright/test';

/**
 * Utilitaires d'authentification E2E deterministes.
 * On evite le login UI (fragile) et on passe par l'API pour obtenir les cookies de session.
 */

export interface TestUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export const TEST_USER: TestUser = {
  email: process.env.E2E_TEST_EMAIL || 'e2e.smoke.local@luneo.app',
  password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!',
  firstName: process.env.E2E_TEST_FIRST_NAME || 'E2E',
  lastName: process.env.E2E_TEST_LAST_NAME || 'Smoke',
};

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestWithRateLimitRetry(run: () => Promise<APIResponse>, label: string): Promise<APIResponse> {
  const maxAttempts = 4;
  let lastResponse: APIResponse | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await run();
    lastResponse = response;

    if (response.status() !== 429) {
      return response;
    }

    if (attempt < maxAttempts) {
      await sleep(600 * attempt);
    }
  }

  const body = lastResponse ? await lastResponse.text().catch(() => '') : '';
  throw new Error(`E2E ${label} rate-limited after ${maxAttempts} attempts: ${body.slice(0, 300)}`);
}

async function ensureOnboardingCompleted(page: Page): Promise<void> {
  const response = await requestWithRateLimitRetry(
    () => page.request.post('/api/v1/onboarding/complete'),
    'onboarding complete',
  );

  // Si endpoint indisponible dans un env, on ne bloque pas le login.
  if (!response.ok() && response.status() !== 404) {
    const body = await response.text().catch(() => '');
    if (response.status() !== 409) {
      // 409 peut arriver si deja complete.
      throw new Error(`E2E onboarding completion failed (${response.status()}): ${body.slice(0, 300)}`);
    }
  }
}

async function tryCreateUser(page: Page, user: TestUser): Promise<void> {
  const response = await requestWithRateLimitRetry(
    () => page.request.post('/api/v1/auth/signup', {
      data: {
        email: user.email,
        password: user.password,
        firstName: user.firstName ?? 'E2E',
        lastName: user.lastName ?? 'Smoke',
      },
    }),
    'signup',
  );

  if (response.ok()) {
    return;
  }

  const status = response.status();
  const body = await response.text().catch(() => '');
  const alreadyExists = status === 409 || /already|existe|taken|duplicate/i.test(body);

  if (!alreadyExists) {
    throw new Error(`E2E signup failed (${status}): ${body.slice(0, 300)}`);
  }
}

async function loginViaApi(page: Page, user: TestUser): Promise<void> {
  const response = await requestWithRateLimitRetry(
    () => page.request.post('/api/v1/auth/login', {
      data: {
        email: user.email,
        password: user.password,
      },
    }),
    'login',
  );

  if (!response.ok()) {
    const body = await response.text().catch(() => '');
    throw new Error(`E2E login failed (${response.status()}): ${body.slice(0, 300)}`);
  }
}

/**
 * Connecte un utilisateur de maniere deterministe via API.
 * Si la session est deja valide, on ne refait pas de login pour eviter le rate-limit.
 */
export async function loginUser(page: Page, user: TestUser = TEST_USER): Promise<void> {
  const meBefore = await requestWithRateLimitRetry(
    () => page.request.get('/api/v1/auth/me'),
    'auth verification',
  );

  if (!meBefore.ok()) {
    await tryCreateUser(page, user);
    await loginViaApi(page, user);
  }

  const meAfter = await requestWithRateLimitRetry(
    () => page.request.get('/api/v1/auth/me'),
    'auth verification',
  );
  if (!meAfter.ok()) {
    const body = await meAfter.text().catch(() => '');
    throw new Error(`E2E auth verification failed (${meAfter.status()}): ${body.slice(0, 300)}`);
  }

  await ensureOnboardingCompleted(page);
}

export async function logoutUser(page: Page): Promise<void> {
  await requestWithRateLimitRetry(
    () => page.request.post('/api/v1/auth/logout'),
    'logout',
  );
  await page.goto('/login');
}

export async function isUserLoggedIn(page: Page): Promise<boolean> {
  const me = await requestWithRateLimitRetry(
    () => page.request.get('/api/v1/auth/me'),
    'auth verification',
  );
  return me.ok();
}

export async function createTestUser(page: Page, user: TestUser): Promise<void> {
  await tryCreateUser(page, user);
}

export async function cleanupTestData(_page: Page): Promise<void> {
  // Intentionnellement vide: nettoyage gere par jobs de maintenance DB.
}
