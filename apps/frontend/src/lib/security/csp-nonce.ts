/**
 * Content Security Policy Nonce Generator
 * 
 * Generates cryptographically secure nonces for CSP
 * to allow inline scripts and styles while maintaining security
 */

/**
 * Generate a cryptographically secure nonce
 * Uses Web Crypto API (compatible with Edge Runtime)
 * @param length - Length of the nonce (default: 16 bytes = 32 hex chars)
 * @returns Base64-encoded nonce
 */
export function generateNonce(length: number = 16): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Get or create nonce for current request
 * Nonces should be unique per request for maximum security
 */
export function getNonce(): string {
  // In Next.js, we can use request headers to store nonce
  // For now, generate a new nonce each time
  // In production, this should be stored per-request
  return generateNonce();
}

/**
 * Build CSP directive with nonce
 * @param nonce - The nonce to include
 * @returns CSP directive string
 *
 * SEC-10: Comprehensive CSP with worker-src, manifest-src, media-src,
 *         Sentry script-src, and report-uri for violation monitoring.
 */
export function buildCSPWithNonce(nonce: string): string {
  const nonceValue = `'nonce-${nonce}'`;
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN ? 'https://*.ingest.sentry.io' : '';
  const reportUri = process.env.CSP_REPORT_URI || '';
  const allowUnsafeEval = process.env.CSP_ALLOW_UNSAFE_EVAL === 'true';
  const scriptUnsafeEval = allowUnsafeEval ? " 'unsafe-eval'" : '';
  
  const directives = [
    "default-src 'self'",
    `script-src 'self' ${nonceValue}${scriptUnsafeEval} https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://*.sentry-cdn.com`,
    `style-src 'self' ${nonceValue} https://fonts.googleapis.com`,
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com data:",
    `connect-src 'self' https://api.luneo.app https://*.luneo.app https://api.stripe.com https://*.sentry.io ${sentryDsn} https://www.google-analytics.com https://region1.google-analytics.com https://vitals.vercel-insights.com`.trim(),
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' blob: data:",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];

  // CSP violation reporting (optional, requires endpoint)
  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  return directives.join('; ');
}

/**
 * Build CSP directive without unsafe-inline or unsafe-eval (strictest)
 * Uses nonces for all inline scripts and styles.
 * SEC-10: No unsafe-eval — recommended for production.
 */
export function buildStrictCSPWithNonce(nonce: string): string {
  const nonceValue = `'nonce-${nonce}'`;
  
  return [
    "default-src 'self'",
    `script-src 'self' ${nonceValue} https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://*.sentry-cdn.com`,
    `style-src 'self' ${nonceValue} https://fonts.googleapis.com`,
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://api.luneo.app https://*.luneo.app https://api.stripe.com https://*.sentry.io https://www.google-analytics.com https://region1.google-analytics.com https://vitals.vercel-insights.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' blob: data:",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
}

/**
 * Build CSP directive for development with strict mode
 * Uses nonces but also allows 'unsafe-eval' for dev tools (HMR, sourcemaps)
 */
export function buildDevCSPWithNonce(nonce: string): string {
  const nonceValue = `'nonce-${nonce}'`;
  
  return [
    "default-src 'self'",
    // 'unsafe-eval' needed for Next.js HMR and development tools
    `script-src 'self' ${nonceValue} 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live`,
    `style-src 'self' ${nonceValue} https://fonts.googleapis.com`,
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' http://localhost:* ws://localhost:* https://api.luneo.app https://*.luneo.app https://api.stripe.com https://*.sentry.io https://www.google-analytics.com https://region1.google-analytics.com https://vitals.vercel-insights.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

/**
 * Utility to extract nonce from headers (for server components)
 */
export function getNonceFromHeaders(headers: Headers): string | null {
  return headers.get('X-CSP-Nonce');
}













