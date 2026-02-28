/* eslint-disable no-console */
const baseUrl = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const adminEmail = process.env.SMOKE_ADMIN_EMAIL;
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD;
const runAuthChecks = process.env.SMOKE_RUN_AUTH_CHECKS === 'true';
const requireServer = process.env.SMOKE_REQUIRE_SERVER === 'true';
const debugAuth = process.env.SMOKE_DEBUG_AUTH === 'true';
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 3000);

const jar = new Map();

function isLikelyValidEmail(value) {
  if (!value) return false;
  const normalized = value.trim();
  if (normalized.includes('...')) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function maskEmail(value) {
  if (!value || !value.includes('@')) return '<invalid>';
  const [localPart, domain] = value.split('@');
  if (!localPart || !domain) return '<invalid>';
  const first = localPart[0];
  const last = localPart[localPart.length - 1];
  const middle = localPart.length > 2 ? '*'.repeat(localPart.length - 2) : '*';
  return `${first}${middle}${last}@${domain}`;
}

function authDebug(label, payload) {
  if (!debugAuth) return;
  console.log(`[AUTH DEBUG] ${label}: ${JSON.stringify(payload)}`);
}

function updateCookies(setCookieHeaders = []) {
  for (const raw of setCookieHeaders) {
    const [firstPart] = raw.split(';');
    const [name, value] = firstPart.split('=');
    if (!name) continue;
    jar.set(name.trim(), (value || '').trim());
  }
}

function cookieHeader() {
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function check(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function expectStatus(res, expected) {
  if (res.status !== expected) {
    throw new Error(`Expected status ${expected}, got ${res.status}`);
  }
}

function isLocalBaseUrl() {
  try {
    const { hostname } = new URL(baseUrl);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

async function canReachBaseUrl() {
  const target = `${baseUrl}/`;
  try {
    const res = await fetch(target, { method: 'HEAD', signal: AbortSignal.timeout(timeoutMs) });
    return res.status > 0;
  } catch {
    try {
      const res = await fetch(target, { method: 'GET', signal: AbortSignal.timeout(timeoutMs) });
      return res.status > 0;
    } catch {
      return false;
    }
  }
}

async function fetchJson(path, init = {}) {
  const headers = new Headers(init.headers || {});
  const cookie = cookieHeader();
  if (cookie) headers.set('cookie', cookie);
  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
  updateCookies(res.headers.getSetCookie?.() || []);
  const data = await res.json().catch(() => null);
  return { res, data };
}

async function fetchText(path, init = {}) {
  const headers = new Headers(init.headers || {});
  const cookie = cookieHeader();
  if (cookie) headers.set('cookie', cookie);
  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
  updateCookies(res.headers.getSetCookie?.() || []);
  const text = await res.text();
  return { res, text };
}

async function followRedirects(path, maxHops = 8) {
  let current = path;
  const visited = [];
  for (let hop = 0; hop <= maxHops; hop++) {
    const res = await fetch(`${baseUrl}${current}`, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });
    visited.push({ path: current, status: res.status });
    const location = res.headers.get('location');
    if (!location || (res.status < 300 || res.status > 399)) {
      return { finalStatus: res.status, visited };
    }
    const nextUrl = new URL(location, `${baseUrl}${current}`);
    current = nextUrl.pathname + nextUrl.search;
  }
  throw new Error(`Redirect chain exceeded ${maxHops} hops: ${visited.map((s) => `${s.path}:${s.status}`).join(' -> ')}`);
}

async function run() {
  console.log(`Running critical smoke on ${baseUrl}`);
  const reachable = await canReachBaseUrl();
  if (!reachable) {
    const message = `Base URL unreachable (${baseUrl}). Start frontend/backend or set SMOKE_BASE_URL.`;
    if (isLocalBaseUrl() && !requireServer) {
      console.log(`SKIP smoke: ${message} Use SMOKE_REQUIRE_SERVER=true to fail instead of skip.`);
      return;
    }
    throw new Error(message);
  }

  await check('public marketing endpoint', async () => {
    const { res } = await fetchJson('/api/public/marketing');
    expectStatus(res, 200);
  });

  await check('sitemap canonical output', async () => {
    const { res, text } = await fetchText('/sitemap.xml');
    expectStatus(res, 200);
    const forbiddenAliases = ['/tarifs', '/ressources', '/produits', '/entreprise'];
    for (const alias of forbiddenAliases) {
      if (text.includes(`${baseUrl}${alias}`)) {
        throw new Error(`Sitemap contains alias ${alias}`);
      }
    }
  });

  await check('admin/login entrypoints do not loop', async () => {
    const admin = await followRedirects('/admin');
    if (![200, 302, 307, 308, 401].includes(admin.finalStatus)) {
      throw new Error(`Unexpected /admin final status: ${admin.finalStatus}`);
    }

    const upperAdmin = await followRedirects('/Admin');
    if (![200, 302, 307, 308, 401, 404].includes(upperAdmin.finalStatus)) {
      throw new Error(`Unexpected /Admin final status: ${upperAdmin.finalStatus}`);
    }

    const doubleSlashAdmin = await followRedirects('//Admin');
    if (doubleSlashAdmin.visited.length > 5) {
      throw new Error(`Potential redirect loop on //Admin: ${doubleSlashAdmin.visited.map((s) => `${s.path}:${s.status}`).join(' -> ')}`);
    }

    const loginRedirect = await followRedirects('/login?redirect=%2Fadmin');
    if (loginRedirect.visited.length > 5) {
      throw new Error(`Potential redirect loop on login redirect: ${loginRedirect.visited.map((s) => `${s.path}:${s.status}`).join(' -> ')}`);
    }
  });

  await check('security headers are present on public entrypoint', async () => {
    const { res } = await fetchText('/');
    const securityHeaders = [
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'strict-transport-security',
      'referrer-policy',
    ];
    const present = securityHeaders.filter((header) => res.headers.get(header));
    if (present.length === 0) {
      throw new Error('No expected security headers found on "/"');
    }
  });

  let csrfTokenForAuth = '';

  await check('csrf token endpoint is reachable', async () => {
    const { res, data } = await fetchJson('/api/csrf/token');
    if (!res.ok) {
      throw new Error(`/api/csrf/token failed with status ${res.status}`);
    }
    csrfTokenForAuth = data?.token || data?.csrfToken || data?.data?.token || jar.get('csrf_token') || '';
    const hasToken = Boolean(csrfTokenForAuth);
    authDebug('csrf-token', {
      status: res.status,
      tokenPresent: hasToken,
      tokenLength: csrfTokenForAuth.length,
      cookiePresent: Boolean(jar.get('csrf_token')),
      cookieKeys: Array.from(jar.keys()),
    });
    if (!hasToken) {
      throw new Error('CSRF endpoint response does not include token-like field');
    }
  });

  await check('support page exposes operational channel', async () => {
    const { res, text } = await fetchText('/help/support');
    expectStatus(res, 200);
    const hasSupportSignal =
      text.includes('support@luneo.app') ||
      text.toLowerCase().includes('support email') ||
      text.toLowerCase().includes('chat');
    if (!hasSupportSignal) {
      throw new Error('Support page does not expose a clear operational channel');
    }
  });

  if (!runAuthChecks) {
    console.log('Skipping auth/admin checks (SMOKE_RUN_AUTH_CHECKS not enabled).');
    return;
  }

  if (!adminEmail || !adminPassword) {
    throw new Error('SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD are required when SMOKE_RUN_AUTH_CHECKS=true');
  }
  if (!isLikelyValidEmail(adminEmail)) {
    throw new Error('SMOKE_ADMIN_EMAIL must be a real email (example: admin@company.com), not a placeholder.');
  }
  authDebug('input', {
    emailMasked: maskEmail(adminEmail),
    emailValid: isLikelyValidEmail(adminEmail),
    passwordLength: adminPassword.length,
    hasCsrfTokenForAuth: Boolean(csrfTokenForAuth),
  });

  await check('login as admin', async () => {
    const { res, data } = await fetchJson('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(csrfTokenForAuth ? { 'x-csrf-token': csrfTokenForAuth } : {}),
      },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    if (res.status !== 200) {
      const details = JSON.stringify(data || {}).slice(0, 500);
      authDebug('login-failed', {
        status: res.status,
        response: data,
        cookieKeys: Array.from(jar.keys()),
        csrfHeaderSent: Boolean(csrfTokenForAuth),
      });
      throw new Error(`Expected status 200, got ${res.status}. Response: ${details}`);
    }
    authDebug('login-success', {
      status: res.status,
      cookieKeys: Array.from(jar.keys()),
    });
  });

  await check('auth me returns 200 after login', async () => {
    const { res } = await fetchJson('/api/v1/auth/me');
    expectStatus(res, 200);
  });

  await check('admin tenants endpoint authorized', async () => {
    const csrfToken = jar.get('csrf_token');
    const { res } = await fetchJson('/api/admin/tenants', {
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
    });
    expectStatus(res, 200);
  });

  await check('logout invalidates session', async () => {
    const csrfToken = jar.get('csrf_token');
    const { res } = await fetchJson('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      body: JSON.stringify({}),
    });
    expectStatus(res, 200);

    const after = await fetchJson('/api/v1/auth/me');
    expectStatus(after.res, 401);
  });
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
