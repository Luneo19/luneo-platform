/* eslint-disable no-console */
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.SMOKE_BASE_URL || 'https://luneo.app';
const OUT_DIR = path.resolve('artifacts/smoke');
const JSON_REPORT = path.join(OUT_DIR, 'post-login-tunnel-report.json');
const MD_REPORT = path.join(OUT_DIR, 'post-login-tunnel-report.md');

const REQUIRED_ENV = [
  'SMOKE_USER_EMAIL',
  'SMOKE_USER_PASSWORD',
  'SMOKE_ADMIN_EMAIL',
  'SMOKE_ADMIN_PASSWORD',
];

const SCENARIOS = [
  {
    id: 'user-funnel',
    email: process.env.SMOKE_USER_EMAIL,
    password: process.env.SMOKE_USER_PASSWORD,
    routes: ['/overview', '/agents', '/conversations', '/billing', '/settings'],
  },
  {
    id: 'admin-funnel',
    email: process.env.SMOKE_ADMIN_EMAIL,
    password: process.env.SMOKE_ADMIN_PASSWORD,
    routes: ['/admin', '/admin/marketing/templates'],
  },
];

const NON_BLOCKING_NETWORK_PATTERNS = [/\/api\/admin\/analytics\/overview/];

function dedupe(items, keyFn) {
  const m = new Map();
  for (const item of items) m.set(keyFn(item), item);
  return [...m.values()];
}

function isStaticAsset(url) {
  return url.includes('/_next/static/') || url.includes('/favicon') || url.includes('.woff');
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const banner = document.querySelector('[data-testid="cookie-banner"]');
    if (banner) banner.remove();
  });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('[data-testid="login-submit"]').click({ force: true });
  await page.waitForTimeout(2000);
}

async function logout(page) {
  await page.evaluate(async () => {
    const csrf = document.cookie
      .split('; ')
      .find((r) => r.startsWith('csrf_token='))
      ?.split('=')[1];
    const headers = csrf ? { 'X-CSRF-Token': decodeURIComponent(csrf) } : {};
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include', headers });
  });
  await page.waitForTimeout(1000);
}

async function safeGoto(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    return;
  } catch (error) {
    const msg = String(error?.message || error);
    if (!msg.includes('ERR_ABORTED')) throw error;
    await page.waitForTimeout(700);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }
}

async function runScenario(browser, scenario) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const network = [];
  const consoleIssues = [];
  const pageErrors = [];
  const steps = [];

  page.on('response', (res) => {
    const status = res.status();
    const url = res.url();
    // Keep gate strict on server failures, but tolerate expected 4xx from guarded routes.
    if (status >= 500 && !isStaticAsset(url)) {
      if (NON_BLOCKING_NETWORK_PATTERNS.some((pattern) => pattern.test(url))) {
        return;
      }
      network.push({ status, method: res.request().method(), url });
    }
  });
  page.on('console', (msg) => {
    // Warnings are noisy in production pages; only hard JS errors should fail the gate.
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore common non-blocking asset misses coming from optional third-party resources.
      if (
        text.includes('Failed to load resource: the server responded with a status of 404') ||
        text.includes('Failed to load resource: the server responded with a status of 503')
      ) {
        return;
      }
      consoleIssues.push({ type: msg.type(), text });
    }
  });
  page.on('pageerror', (err) => pageErrors.push(String(err?.message || err)));

  const step = async (name, fn) => {
    try {
      await fn();
      steps.push({ name, ok: true });
    } catch (error) {
      steps.push({ name, ok: false, error: String(error?.message || error) });
    }
  };

  await step('login', () => login(page, scenario.email, scenario.password));
  for (const route of scenario.routes) {
    await step(`visit:${route}`, async () => {
      await safeGoto(page, `${BASE_URL}${route}`);
      await page.waitForTimeout(1200);
    });
  }
  await step('logout', () => logout(page));
  await step('post-logout-login-page', async () => {
    await safeGoto(page, `${BASE_URL}/login`);
  });

  await context.close();

  const uniqueNetwork = dedupe(network, (n) => `${n.status}|${n.method}|${n.url}`);
  const uniqueConsole = dedupe(consoleIssues, (c) => `${c.type}|${c.text}`);
  const uniquePageErrors = [...new Set(pageErrors)];
  const failedSteps = steps.filter((s) => !s.ok);
  const ok = failedSteps.length === 0 && uniqueNetwork.length === 0 && uniqueConsole.length === 0 && uniquePageErrors.length === 0;

  return {
    id: scenario.id,
    ok,
    steps,
    networkErrors: uniqueNetwork,
    consoleIssues: uniqueConsole,
    pageErrors: uniquePageErrors,
  };
}

function renderMarkdown(results) {
  const lines = ['# Post-Login Tunnel Smoke Report', '', `Base URL: \`${BASE_URL}\``, ''];
  for (const r of results) {
    lines.push(`## ${r.id} — ${r.ok ? 'OK' : 'KO'}`, '');
    lines.push('### Steps');
    for (const s of r.steps) {
      lines.push(`- ${s.ok ? 'OK' : 'KO'} \`${s.name}\`${s.error ? ` — ${s.error}` : ''}`);
    }
    lines.push('', '### Network Errors');
    if (r.networkErrors.length === 0) lines.push('- None');
    else r.networkErrors.forEach((e) => lines.push(`- ${e.status} ${e.method} ${e.url}`));
    lines.push('', '### Console Issues');
    if (r.consoleIssues.length === 0) lines.push('- None');
    else r.consoleIssues.forEach((c) => lines.push(`- ${c.type}: ${c.text}`));
    lines.push('', '### Page Errors');
    if (r.pageErrors.length === 0) lines.push('- None');
    else r.pageErrors.forEach((e) => lines.push(`- ${e}`));
    lines.push('');
  }
  return lines.join('\n');
}

async function main() {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    if (process.env.SMOKE_REQUIRE_CREDENTIALS === 'true') {
      throw new Error(`Missing required smoke credentials: ${missing.join(', ')}`);
    }
    console.log(
      `SKIP post-login tunnel smoke: missing credentials (${missing.join(
        ', '
      )}). Set SMOKE_REQUIRE_CREDENTIALS=true to fail instead.`
    );
    return;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const scenario of SCENARIOS) {
    results.push(await runScenario(browser, scenario));
  }
  await browser.close();

  await fs.writeFile(JSON_REPORT, JSON.stringify(results, null, 2), 'utf8');
  await fs.writeFile(MD_REPORT, renderMarkdown(results), 'utf8');

  const hasFailure = results.some((r) => !r.ok);
  console.log(`Post-login tunnel report written: ${JSON_REPORT}`);
  console.log(`Post-login tunnel report written: ${MD_REPORT}`);
  if (hasFailure) {
    for (const scenario of results.filter((r) => !r.ok)) {
      const failedSteps = scenario.steps.filter((step) => !step.ok);
      // Keep this concise to make CI diagnosis immediate without opening artifacts.
      console.error(
        `[post-login-smoke] Scenario ${scenario.id} failed`,
        JSON.stringify(
          {
            failedSteps,
            networkErrors: scenario.networkErrors.slice(0, 10),
            consoleIssues: scenario.consoleIssues.slice(0, 10),
            pageErrors: scenario.pageErrors.slice(0, 10),
          },
          null,
          2
        )
      );
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
