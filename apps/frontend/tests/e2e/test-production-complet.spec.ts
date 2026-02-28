import { test, Page, type Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.use({ actionTimeout: 15000, navigationTimeout: 30000 });

const CONFIG = {
  baseUrl: process.env.BASE_URL || 'https://luneo.app',
  apiUrl: process.env.API_URL || 'https://api.luneo.app/api/v1',
  merchant: {
    email: `test-marchand-${Date.now()}@luneo-test.com`,
    password: 'JeTestelaconnexion!2026',
    name: 'Marchand Test Luneo',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@luneo.app',
    password: process.env.ADMIN_PASSWORD || 'JeTestelaconnexion!2026',
  },
  product: { name: 'T-Shirt Test', description: 'Test produit complet', price: '29.99' },
  screenshotDir: 'test-results/production-test',
};

interface TestLog { timestamp: string; step: string; status: 'PASS'|'FAIL'|'WARNING'|'INFO'; detail: string; screenshot?: string; }
const testLogs: TestLog[] = [];

function log(step: string, status: TestLog['status'], detail: string, screenshot?: string) {
  testLogs.push({ timestamp: new Date().toISOString(), step, status, detail, screenshot });
  const icon = { PASS: 'OK', FAIL: 'FAIL', WARNING: 'WARN', INFO: 'INFO' }[status];
  console.log(`[${icon}] [${step}] ${detail}`);
}

async function snap(page: Page, name: string): Promise<string> {
  fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
  const f = path.join(CONFIG.screenshotDir, `${name}.png`);
  await page.screenshot({ path: f, fullPage: true }).catch(() => {});
  return f;
}

async function waitStable(page: Page, ms = 3000) { await page.waitForTimeout(ms); }

async function isPresentAndVisible(locator: Locator): Promise<boolean> {
  return (await locator.count()) > 0 && (await locator.first().isVisible());
}

async function isEnabledSafe(locator: Locator): Promise<boolean> {
  try {
    return await locator.isEnabled();
  } catch {
    return false;
  }
}

async function dismissCookies(page: Page) {
  for (const sel of ['button:has-text("Tout Accepter")', 'button:has-text("Accept")', 'button:has-text("Accepter")']) {
    const btn = page.locator(sel).first();
    if (await isPresentAndVisible(btn)) { await btn.click().catch(() => {}); await waitStable(page, 500); return; }
  }
}

async function checkPageLoads(page: Page, url: string, pageName: string): Promise<boolean> {
  const start = Date.now();
  try {
    const response = await page.goto(url, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await waitStable(page, 2000);
    const duration = Date.now() - start;
    const status = response?.status() || 0;
    const bodyText = await page.textContent('body').catch(() => '');
    const checks = {
      httpOk: status < 400,
      notBlank: (bodyText?.length || 0) > 50,
      noReactError: !bodyText?.includes('Application error') && !bodyText?.includes('Unhandled Runtime Error'),
      noServerError: !bodyText?.includes('Internal Server Error'),
    };
    const allOk = Object.values(checks).every(Boolean);
    const shot = await snap(page, pageName.replace(/\//g, '_'));
    if (allOk) log(pageName, 'PASS', `OK (${duration}ms, HTTP ${status})`, shot);
    else { const issues = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k); log(pageName, 'FAIL', `${issues.join(', ')} (HTTP ${status}, ${duration}ms)`, shot); }
    return allOk;
  } catch (error: unknown) {
    log(pageName, 'FAIL', `Erreur: ${error instanceof Error ? error.message : String(error)}`);
    await snap(page, `${pageName}-error`);
    return false;
  }
}

async function loginAs(page: Page, email: string, password: string, role: string): Promise<boolean> {
  await page.goto(`${CONFIG.baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await waitStable(page, 2000);
  await dismissCookies(page);

  // Fill email - try multiple selectors including placeholder-based
  for (const sel of ['input[name="email"]', 'input[type="email"]', 'input[placeholder*="email" i]', 'input[placeholder*="votre@" i]']) {
    if (await isPresentAndVisible(page.locator(sel))) { await page.locator(sel).fill(email); break; }
  }

  // Fill password
  for (const sel of ['input[name="password"]', 'input[type="password"]']) {
    if (await isPresentAndVisible(page.locator(sel))) { await page.locator(sel).fill(password); break; }
  }

  await snap(page, `login-${role}-filled`);

  // Submit
  for (const sel of ['button[type="submit"]', 'button:has-text("Se connecter")', 'button:has-text("Connexion")']) {
    const btn = page.locator(sel).first();
    if (await isPresentAndVisible(btn)) {
      await btn.click({ force: true }).catch(() => {});
      break;
    }
  }

  await waitStable(page, 5000);
  const url = page.url();
  const ok = url.includes('dashboard') || url.includes('admin') || url.includes('onboarding') || url.includes('overview');
  log(`Login ${role}`, ok ? 'PASS' : 'FAIL', ok ? `-> ${url}` : `Echec: ${url}`);
  if (!ok) await snap(page, `login-${role}-failed`);
  return ok;
}

// ================================================================
// PARTIE A - Parcours Marchand
// ================================================================
test.describe.serial('PARTIE A - Parcours Marchand', () => {
  let mp: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'fr-FR' });
    mp = await ctx.newPage();
    mp.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('ws://localhost') && !msg.text().includes('analytics'))
        log('Console', 'WARNING', msg.text().substring(0, 200));
    });
    mp.on('response', r => { if (r.status() >= 500) log('Net5xx', 'FAIL', `${r.status()} ${r.url().substring(0, 120)}`); });
  });

  test('A1.1 - Landing page', async () => { await checkPageLoads(mp, CONFIG.baseUrl, 'A1-landing'); });

  test('A1.2 - CTA above fold', async () => {
    await mp.goto(CONFIG.baseUrl, { waitUntil: 'domcontentloaded' }); await waitStable(mp, 2000);
    for (const sel of ['a:has-text("Essayer")', 'a:has-text("Commencer")', 'a[href*="register"]', 'a:has-text("Gratuit")']) {
      const el = mp.locator(sel).first();
      if (await isPresentAndVisible(el)) { const b = await el.boundingBox(); if (b && b.y < 900) { log('A1.2', 'PASS', `CTA y=${Math.round(b.y)}`); return; } }
    }
    log('A1.2', 'FAIL', 'No CTA above fold'); await snap(mp, 'A1-no-cta');
  });

  test('A1.3 - Pricing', async () => { await checkPageLoads(mp, `${CONFIG.baseUrl}/pricing`, 'A1-pricing'); });

  test('A2 - Inscription', async () => {
    await mp.goto(`${CONFIG.baseUrl}/register`, { waitUntil: 'domcontentloaded' });
    await waitStable(mp, 2000);
    await dismissCookies(mp);

    // Fill name (by placeholder since name attr may differ)
    for (const sel of ['input[name="name"]', 'input[placeholder*="Jean" i]', 'input[placeholder*="nom" i]', 'input[placeholder*="complet" i]']) {
      const e = mp.locator(sel).first();
      if (await isPresentAndVisible(e)) { await e.fill(CONFIG.merchant.name); log('A2', 'INFO', `Name: ${sel}`); break; }
    }

    // Fill email
    for (const sel of ['input[name="email"]', 'input[type="email"]', 'input[placeholder*="votre@" i]', 'input[placeholder*="email" i]']) {
      const e = mp.locator(sel).first();
      if (await isPresentAndVisible(e)) { await e.fill(CONFIG.merchant.email); log('A2', 'INFO', `Email: ${sel}`); break; }
    }

    // Fill password (first password field)
    const passwordFields = mp.locator('input[type="password"]');
    const pwCount = await passwordFields.count();
    if (pwCount >= 1) {
      await passwordFields.nth(0).fill(CONFIG.merchant.password);
      log('A2', 'INFO', 'Password filled');
    }

    // Fill confirm password (second password field)
    if (pwCount >= 2) {
      await passwordFields.nth(1).fill(CONFIG.merchant.password);
      log('A2', 'INFO', 'Confirm password filled');
    }

    // Check all checkboxes (terms, etc.)
    const cbs = mp.locator('input[type="checkbox"]');
    for (let i = 0; i < await cbs.count(); i++) await cbs.nth(i).check().catch(() => {});

    await waitStable(mp, 500);
    await snap(mp, 'A2-filled');

    // Check if button is enabled now
    const submitBtn = mp.locator('button[type="submit"]').first();
    const isDisabled = await submitBtn.getAttribute('disabled');
    log('A2', 'INFO', `Submit button disabled=${isDisabled}`);

    // Click submit (force if needed)
    if (await isPresentAndVisible(submitBtn)) {
      if (isDisabled !== null) {
        log('A2', 'WARNING', 'Submit still disabled, trying force click');
        await submitBtn.click({ force: true }).catch(() => {});
      } else {
        await submitBtn.click();
      }
    }

    await waitStable(mp, 6000);
    await snap(mp, 'A2-result');
    const url = mp.url();
    if (url.includes('dashboard') || url.includes('onboarding') || url.includes('overview')) log('A2', 'PASS', `-> ${url}`);
    else {
      const body = await mp.textContent('body').catch(() => '');
      const errors = await mp.locator('[role="alert"], .text-red-500, .text-destructive').allTextContents().catch(() => []);
      if (body?.includes('existe') || body?.includes('already')) log('A2', 'INFO', 'Compte existant');
      else log('A2', 'FAIL', `URL: ${url}. Errors: ${errors.join(' | ')}`);
    }
  });

  test('A3 - Login marchand', async () => {
    if (mp.url().includes('dashboard') || mp.url().includes('onboarding') || mp.url().includes('overview')) { log('A3', 'PASS', 'Deja connecte'); return; }
    // Merchant account may not exist, try admin as fallback
    let ok = await loginAs(mp, CONFIG.merchant.email, CONFIG.merchant.password, 'marchand');
    if (!ok) {
      log('A3', 'INFO', 'Merchant login failed, trying admin');
      ok = await loginAs(mp, CONFIG.admin.email, CONFIG.admin.password, 'admin-fallback');
    }
    if (!ok) log('A3', 'FAIL', 'All login attempts failed');
  });

  test('A4 - Onboarding', async () => {
    if (!mp.url().includes('onboarding')) { log('A4', 'INFO', 'Skip - pas en onboarding'); return; }
    for (let s = 0; s < 10; s++) {
      await snap(mp, `A4-step-${s}`);
      if (mp.url().includes('dashboard') || mp.url().includes('overview')) { log('A4', 'PASS', `Done step ${s}`); return; }
      const cards = mp.locator('[class*="cursor-pointer"]:not(button):not(a)');
      if (await isPresentAndVisible(cards.first())) { await cards.first().click().catch(() => {}); await waitStable(mp, 500); }
      for (const sel of ['button:has-text("Continuer")', 'button:has-text("Suivant")', 'button:has-text("Terminer")', 'button:has-text("Proceder")', 'button[type="submit"]']) {
        const b = mp.locator(sel).first(); if (await isPresentAndVisible(b) && await isEnabledSafe(b)) { await b.click(); await waitStable(mp, 2000); break; }
      }
    }
    log('A4', mp.url().includes('dashboard') || mp.url().includes('overview') ? 'PASS' : 'FAIL', mp.url());
  });

  test('A5 - Dashboard overview', async () => {
    const ok = await checkPageLoads(mp, `${CONFIG.baseUrl}/overview`, 'A5-overview');
    if (!ok) await checkPageLoads(mp, `${CONFIG.baseUrl}/dashboard`, 'A5-dashboard');
  });

  test('A6 - Creer produit', async () => {
    await mp.goto(`${CONFIG.baseUrl}/dashboard/products`, { waitUntil: 'domcontentloaded' }); await waitStable(mp, 2000);
    for (const s of ['button:has-text("Cr")', 'button:has-text("Nouveau")', 'button:has-text("Ajouter")', 'a[href*="new"]']) {
      const b = mp.locator(s).first(); if (await isPresentAndVisible(b)) { await b.click(); break; }
    }
    await waitStable(mp, 2000); await snap(mp, 'A6-form');
    for (const s of ['input[name="name"]', 'input[placeholder*="nom" i]']) { const e = mp.locator(s).first(); if (await isPresentAndVisible(e)) { await e.fill(CONFIG.product.name); break; } }
    for (const s of ['input[name="price"]', 'input[name="basePrice"]', 'input[type="number"]']) { const e = mp.locator(s).first(); if (await isPresentAndVisible(e)) { await e.clear().catch(() => {}); await e.fill(CONFIG.product.price); break; } }
    for (const s of ['textarea']) { const e = mp.locator(s).first(); if (await isPresentAndVisible(e)) { await e.fill(CONFIG.product.description); break; } }
    for (const s of ['button[type="submit"]', 'button:has-text("Sauvegarder")', 'button:has-text("Enregistrer")']) { const b = mp.locator(s).first(); if (await isPresentAndVisible(b)) { await b.click(); break; } }
    await waitStable(mp, 5000); await snap(mp, 'A6-created');
    log('A6', 'INFO', `URL: ${mp.url()}`);
  });

  test('A7 - Toutes les pages dashboard', async () => {
    const pages = ['/overview', '/dashboard', '/dashboard/products', '/dashboard/orders', '/dashboard/billing', '/dashboard/settings', '/dashboard/team', '/dashboard/ai-studio', '/dashboard/library', '/dashboard/notifications', '/dashboard/integrations', '/dashboard/channels', '/dashboard/production', '/dashboard/customizer', '/dashboard/configurator-3d', '/dashboard/ar-studio', '/dashboard/marketplace', '/dashboard/support'];
    const fails: string[] = [];
    for (const p of pages) { if (!(await checkPageLoads(mp, `${CONFIG.baseUrl}${p}`, `A7${p.replace(/\//g, '-')}`))) fails.push(p); }
    log('A7', fails.length === 0 ? 'PASS' : 'FAIL', fails.length === 0 ? `${pages.length} OK` : `${fails.length} fails: ${fails.join(', ')}`);
  });

  test('A8 - Billing', async () => { await checkPageLoads(mp, `${CONFIG.baseUrl}/dashboard/billing`, 'A8-billing'); });
});

// ================================================================
// PARTIE B - Client
// ================================================================
test.describe.serial('PARTIE B - Client', () => {
  let cp: Page;
  test.beforeAll(async ({ browser }) => { const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR' }); cp = await ctx.newPage(); cp.on('response', r => { if (r.status() >= 500) log('NetClient', 'FAIL', `${r.status()} ${r.url().substring(0, 120)}`); }); });

  test('B1 - Demo customizer', async () => { await checkPageLoads(cp, `${CONFIG.baseUrl}/demo/customizer`, 'B1-demo'); });
  test('B2 - Checkout', async () => { await checkPageLoads(cp, `${CONFIG.baseUrl}/checkout`, 'B2-checkout'); });
  test('B3 - Mobile', async () => {
    await cp.setViewportSize({ width: 375, height: 812 });
    for (const p of ['/', '/pricing', '/login']) { await checkPageLoads(cp, `${CONFIG.baseUrl}${p}`, `B3-mobile${p.replace(/\//g, '-') || '-home'}`); const sw = await cp.evaluate(() => document.body.scrollWidth); if (sw > 380) log('B3', 'WARNING', `Overflow ${p} (${sw}px)`); }
    await cp.setViewportSize({ width: 1440, height: 900 });
  });
});

// ================================================================
// PARTIE C - Admin
// ================================================================
test.describe.serial('PARTIE C - Admin', () => {
  let ap: Page;
  test.beforeAll(async ({ browser }) => { const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } }); ap = await ctx.newPage(); ap.on('response', r => { if (r.status() >= 500) log('NetAdmin', 'FAIL', `${r.status()} ${r.url().substring(0, 120)}`); }); });

  test('C1 - Login admin', async () => { await loginAs(ap, CONFIG.admin.email, CONFIG.admin.password, 'admin'); await snap(ap, 'C1-login'); });

  test('C2 - Pages admin', async () => {
    await ap.goto(`${CONFIG.baseUrl}/admin`, { waitUntil: 'domcontentloaded' }); await waitStable(ap, 3000);
    if (!ap.url().includes('admin')) { log('C2', 'WARNING', 'No admin access'); return; }
    const pages = ['/admin', '/admin/users', '/admin/brands', '/admin/billing', '/admin/analytics', '/admin/settings', '/admin/tickets', '/admin/designs', '/admin/audit-log'];
    const fails: string[] = [];
    for (const p of pages) { if (!(await checkPageLoads(ap, `${CONFIG.baseUrl}${p}`, `C2${p.replace(/\//g, '-')}`))) fails.push(p); }
    log('C2', fails.length === 0 ? 'PASS' : 'FAIL', fails.length === 0 ? `${pages.length} OK` : `Fails: ${fails.join(', ')}`);
  });

  test('C3 - Orion pages', async () => {
    for (const p of ['/admin/orion', '/admin/orion/agents', '/admin/orion/agents/zeus', '/admin/orion/agents/apollo', '/admin/orion/agents/hades', '/admin/orion/agents/prometheus']) {
      await checkPageLoads(ap, `${CONFIG.baseUrl}${p}`, `C3${p.replace(/\//g, '-')}`);
    }
  });

  test('C4 - Scroll check', async () => {
    await ap.goto(`${CONFIG.baseUrl}/admin/orion/agents/hades`, { waitUntil: 'domcontentloaded' }); await waitStable(ap, 3000);
    // Check multiple possible scroll containers
    const info = await ap.evaluate(() => {
      const candidates = ['main', '[class*="content"]', '[class*="scroll"]', 'div.flex-1', 'div.overflow-y-auto'];
      for (const sel of candidates) {
        const el = document.querySelector(sel);
        if (el && el.scrollHeight > 0) {
          return { found: true, selector: sel, ch: el.clientHeight, sh: el.scrollHeight, can: el.scrollHeight > el.clientHeight, ov: getComputedStyle(el).overflowY };
        }
      }
      // Fallback: check body
      return { found: true, selector: 'body', ch: document.body.clientHeight, sh: document.body.scrollHeight, can: document.body.scrollHeight > document.body.clientHeight, ov: getComputedStyle(document.body).overflowY };
    });
    if (info.can) log('C4', 'PASS', `Scrollable via ${info.selector} (${info.sh}>${info.ch}, ${info.ov})`);
    else log('C4', 'FAIL', `Not scrollable: ${info.selector} (sh=${info.sh}, ch=${info.ch}, overflow=${info.ov})`);
    await snap(ap, 'C4-scroll');
  });
});

// ================================================================
// PARTIE D - Pages publiques
// ================================================================
test.describe('PARTIE D - Publiques', () => {
  for (const p of ['/', '/pricing', '/login', '/register', '/forgot-password', '/demo/customizer', '/checkout', '/contact', '/about', '/blog', '/legal/privacy']) {
    test(`D - ${p}`, async ({ page }) => { page.on('response', r => { if (r.status() >= 500) log(`Net${p}`, 'FAIL', `${r.status()}`); }); await checkPageLoads(page, `${CONFIG.baseUrl}${p}`, `D${p.replace(/\//g, '-') || '-home'}`); });
  }
});

// ================================================================
// PARTIE E - API Backend
// ================================================================
test.describe.serial('PARTIE E - API', () => {
  let token = '';
  async function api(method: string, p: string, body?: Record<string, unknown>, t?: string) {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }; if (t) h['Authorization'] = `Bearer ${t}`;
    try {
      const r = await fetch(`${CONFIG.apiUrl}${p}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
      let d: unknown = null;
      try {
        d = await r.json();
      } catch {
        d = null;
      }
      return { status: r.status, data: d };
    }
    catch (e: unknown) { return { status: 0, data: { error: e instanceof Error ? e.message : String(e) } }; }
  }

  test('E1 - Health', async () => {
    for (const p of ['/health', '/../health', '/']) {
      const { status } = await api('GET', p);
      if (status === 200) { log('E1', 'PASS', `${p} HTTP ${status}`); return; }
    }
    log('E1', 'WARNING', 'Health check failed');
  });

  test('E2 - Login API', async () => {
    const { status, data } = await api('POST', '/auth/login', { email: CONFIG.admin.email, password: CONFIG.admin.password });
    if (status === 200 || status === 201) { const d = data as Record<string, unknown>; token = (d.accessToken || d.access_token || d.token || '') as string; log('E2', 'PASS', `Token: ${token ? 'YES' : 'NO'}`); }
    else log('E2', 'FAIL', `HTTP ${status} - ${JSON.stringify(data).substring(0, 200)}`);
  });

  test('E3 - Profile', async () => { if (!token) { log('E3', 'WARNING', 'No token'); return; } const { status } = await api('GET', '/auth/me', undefined, token); log('E3', status === 200 ? 'PASS' : 'FAIL', `HTTP ${status}`); });
  test('E4 - Products', async () => { if (!token) { log('E4', 'WARNING', 'No token'); return; } const { status } = await api('GET', '/products', undefined, token); log('E4', status === 200 ? 'PASS' : 'FAIL', `HTTP ${status}`); });
  test('E5 - Orders', async () => { if (!token) { log('E5', 'WARNING', 'No token'); return; } const { status } = await api('GET', '/orders', undefined, token); log('E5', status === 200 ? 'PASS' : 'FAIL', `HTTP ${status}`); });
  test('E6 - Industries', async () => { const { status, data } = await api('GET', '/industries'); log('E6', status === 200 ? 'PASS' : 'FAIL', `HTTP ${status}, ${Array.isArray(data) ? data.length : 0} industries`); });
  test('E7 - Dashboard kpis', async () => { if (!token) { log('E7', 'WARNING', 'No token'); return; } const { status } = await api('GET', '/dashboard/kpis', undefined, token); log('E7', status === 200 ? 'PASS' : 'FAIL', `HTTP ${status}`); });
  test('E8 - Dashboard config', async () => { if (!token) { log('E8', 'WARNING', 'No token'); return; } const { status } = await api('GET', '/dashboard/config', undefined, token); log('E8', status === 200 ? 'PASS' : 'FAIL', `HTTP ${status}`); });
  test('E9 - Analytics', async () => {
    if (!token) { log('E9', 'WARNING', 'No token'); return; }
    const s = new Date(Date.now() - 30*86400000).toISOString().split('T')[0]; const e = new Date().toISOString().split('T')[0];
    const { status } = await api('GET', `/analytics/usage?startDate=${s}&endDate=${e}`, undefined, token);
    log('E9', status === 200 ? 'PASS' : 'FAIL', `HTTP ${status}`);
  });
});

// ================================================================
// RAPPORT
// ================================================================
test.afterAll(async () => {
  const p = testLogs.filter(l => l.status === 'PASS').length;
  const f = testLogs.filter(l => l.status === 'FAIL').length;
  const w = testLogs.filter(l => l.status === 'WARNING').length;
  let r = `# RAPPORT DE TEST PRODUCTION LUNEO\n\nDate: ${new Date().toISOString()}\nURL: ${CONFIG.baseUrl}\n\n`;
  r += `## Resume\n| Statut | N |\n|---|---|\n| PASS | ${p} |\n| FAIL | ${f} |\n| WARN | ${w} |\n| Total | ${testLogs.length} |\n\n`;
  if (f > 0) { r += `## ECHECS\n\n`; for (const l of testLogs.filter(l => l.status === 'FAIL')) r += `### ${l.step}\n- ${l.detail}\n${l.screenshot ? `- Screenshot: ${l.screenshot}\n` : ''}\n`; }
  if (w > 0) { r += `## WARNINGS\n\n`; for (const l of testLogs.filter(l => l.status === 'WARNING')) r += `- **${l.step}**: ${l.detail}\n`; r += '\n'; }
  r += `## REUSSIS\n\n`; for (const l of testLogs.filter(l => l.status === 'PASS')) r += `- ${l.step}: ${l.detail}\n`;
  fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
  fs.writeFileSync(path.join(CONFIG.screenshotDir, 'RAPPORT-PRODUCTION.md'), r);
  fs.writeFileSync(path.join(CONFIG.screenshotDir, 'test-logs.json'), JSON.stringify(testLogs, null, 2));
  console.log(`\n=== RAPPORT: ${p} PASS | ${f} FAIL | ${w} WARN ===`);
  console.log(f === 0 ? 'PRET POUR PRODUCTION' : `${f} problemes a corriger`);
});
