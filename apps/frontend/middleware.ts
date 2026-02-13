/**
 * Security Middleware
 * Audit sécurité complet : Headers, CORS, Rate Limiting, CSRF
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateNonce, buildCSPWithNonce } from '@/lib/security/csp-nonce';
import { logger } from '@/lib/logger';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Configuration
const config = {
  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: {
      api: 100,      // 100 requests per minute for API
      auth: 10,      // 10 attempts per minute for auth
      public: 200,   // 200 requests per minute for public pages
    },
  },
  // CORS
  cors: {
    allowedOrigins: [
      'https://luneo.app',
      'https://www.luneo.app',
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    ].filter(Boolean),
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'Accept',
    ],
  },
  // Protected routes requiring authentication
  protectedRoutes: [
    '/admin',
    '/dashboard',
    '/overview',
    '/settings',
    '/billing',
    '/team',
    '/ai-studio',
    '/onboarding',
    '/api/designs',
    '/api/billing',
    '/api/team',
    '/api/profile',
    '/api/settings',
    '/api/notifications',
    '/api/ai',
  ],
  // Routes that require completed onboarding (redirect to /onboarding if not done)
  onboardingRequiredRoutes: [
    '/dashboard',
    '/overview',
    '/ai-studio',
  ],
  // Public API routes (no auth required)
  publicApiRoutes: [
    '/api/public',
    '/api/auth',
    '/api/health',
    '/api/contact',
    '/api/newsletter',
    '/api/stripe/webhook',
    '/api/webhooks',
  ],
};

const SUPPORTED_LOCALES = ['en', 'fr', 'de', 'es', 'it'] as const;
const LOCALE_COOKIE = 'luneo_locale';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Ignorer les fichiers statiques et assets pour éviter les 404
  if (
    pathname.startsWith('/_next/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|json|js|css|map)$/i) ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.png' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/service-worker.js'
  ) {
    return NextResponse.next();
  }

  // Locale from ?lang=: set cookie and redirect so server reads cookie
  const langParam = request.nextUrl.searchParams.get('lang');
  if (langParam && SUPPORTED_LOCALES.includes(langParam.toLowerCase() as (typeof SUPPORTED_LOCALES)[number])) {
    const locale = langParam.toLowerCase();
    const url = request.nextUrl.clone();
    url.searchParams.delete('lang');
    const res = NextResponse.redirect(url);
    res.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 31536000, sameSite: 'lax' });
    return res;
  }
  
  // Generate nonce for CSP (unique per request)
  const nonce = generateNonce();
  const response = NextResponse.next();

  // 1. Security Headers (with nonce)
  setSecurityHeaders(response, nonce);

  // 2. CORS for API routes
  if (pathname.startsWith('/api/')) {
    const corsResponse = handleCORS(request, response);
    if (corsResponse) return corsResponse;
  }

  // 3. Rate Limiting
  const rateLimitResponse = await handleRateLimit(request, pathname);
  if (rateLimitResponse) return rateLimitResponse;

  // 4. CSRF Protection for mutations
  if (shouldCheckCSRF(request, pathname)) {
    const csrfResponse = handleCSRF(request);
    if (csrfResponse) return csrfResponse;
  }

  // 5. Bot Protection
  if (isBot(request)) {
    return handleBot(request, pathname);
  }

  // 6. Auth Protection for dashboard routes (server-side cookie check)
  // Prevents flash of unauthenticated content. Full validation happens client-side.
  const isProtectedRoute = config.protectedRoutes.some(
    (route) => pathname.startsWith(route) && !pathname.startsWith('/api/')
  );

  if (isProtectedRoute) {
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!accessToken && !refreshToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 7. Admin role verification
  // PRODUCTION FIX: Check user role from cookie/JWT for admin routes
  // This prevents non-admin users from accessing /admin/* pages
  if (pathname.startsWith('/admin')) {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (accessToken) {
      try {
        // Decode JWT payload (no verification - that's the backend's job)
        // This is a lightweight client-side guard; full RBAC is enforced server-side
        const payload = JSON.parse(
          Buffer.from(accessToken.split('.')[1], 'base64').toString()
        );
        const userRole = payload.role || payload.userRole || '';
        // SECURITY FIX: Only PLATFORM_ADMIN exists in Prisma UserRole enum
        if (userRole !== 'PLATFORM_ADMIN') {
          // Non-admin user trying to access admin routes - redirect to dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch {
        // If JWT decode fails, let the backend handle it
        // Don't block - the layout/API will reject unauthorized access
      }
    }
  }

  // 8. Prevent CDN caching for admin routes
  // Admin pages are dynamic (they read cookies and check roles server-side).
  // CDN must NEVER serve a cached redirect for these routes.
  if (pathname.startsWith('/admin')) {
    response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    response.headers.set('CDN-Cache-Control', 'private, no-store');
    response.headers.set('Vercel-CDN-Cache-Control', 'private, no-store');
  }

  // 9. Onboarding check — redirect to /onboarding if not completed
  // This is a lightweight cookie-based check. Full validation is in the dashboard layout.
  const requiresOnboarding = config.onboardingRequiredRoutes.some(
    (route) => pathname.startsWith(route) && !pathname.startsWith('/api/')
  );

  if (requiresOnboarding) {
    const onboardingCompleted = request.cookies.get('onboarding_completed')?.value;
    // Only redirect if we have a definitive "false" signal
    // (cookie set by the app after auth/me check)
    if (onboardingCompleted === 'false' && pathname !== '/onboarding') {
      const onboardingUrl = new URL('/onboarding', request.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }

  return response;
}

/**
 * Set security headers
 */
function setSecurityHeaders(response: NextResponse, nonce?: string): void {
  // Strict Transport Security
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Content Security Policy with nonce
  // Nonces provide better security than 'unsafe-inline'
  let csp: string;
  
  // Use nonce-based CSP in all environments for consistent security
  // Set DISABLE_CSP_NONCES=true to use unsafe-inline for debugging
  const useNonces = nonce && process.env.DISABLE_CSP_NONCES !== 'true';
  
  if (useNonces) {
    // Use nonce-based CSP for better security
    csp = buildCSPWithNonce(nonce);
  } else {
    // Fallback to unsafe-inline CSP (only for debugging when DISABLE_CSP_NONCES=true)
    csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://*.sentry-cdn.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
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

  response.headers.set('Content-Security-Policy', csp);
  
  // Store nonce in header for use in pages/components
  if (nonce) {
    response.headers.set('X-CSP-Nonce', nonce);
  }

  // Other security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(self), interest-cohort=()'
  );

  // Remove server identification
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');
}

/**
 * Handle CORS
 */
function handleCORS(request: NextRequest, response: NextResponse): NextResponse | null {
  const origin = request.headers.get('origin');

  // Handle preflight
  if (request.method === 'OPTIONS') {
    const preflightResponse = new NextResponse(null, { status: 204 });
    
    if (origin && isAllowedOrigin(origin)) {
      preflightResponse.headers.set('Access-Control-Allow-Origin', origin);
      preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    preflightResponse.headers.set(
      'Access-Control-Allow-Methods',
      config.cors.allowedMethods.join(', ')
    );
    preflightResponse.headers.set(
      'Access-Control-Allow-Headers',
      config.cors.allowedHeaders.join(', ')
    );
    preflightResponse.headers.set('Access-Control-Max-Age', '86400');

    return preflightResponse;
  }

  // Set CORS headers for regular requests
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return null;
}

function isAllowedOrigin(origin: string): boolean {
  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return true;
    }
  }
  return config.cors.allowedOrigins.includes(origin);
}

/**
 * Handle Rate Limiting
 * Uses Upstash Redis for distributed rate limiting
 */
async function handleRateLimit(
  request: NextRequest,
  pathname: string
): Promise<NextResponse | null> {
  // Skip rate limiting in development (but can be enabled for testing)
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_RATE_LIMIT_IN_DEV !== 'true') {
    return null;
  }

  // Skip rate limiting for excluded paths
  const excludedPaths = [
    '/api/stripe/webhook',
    '/api/auth/callback',
    '/api/health',
    '/api/robots',
    '/api/sitemap',
  ];

  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  try {
    // Use Upstash rate limiting if available
    const { checkRateLimit, getClientIdentifier, getRateLimitConfig } = await import('@/lib/rate-limit');
    
    const identifier = getClientIdentifier(request as Request);
    const config = getRateLimitConfig(pathname);
    const result = await checkRateLimit(identifier, config);

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset.getTime() - Date.now()) / 1000);

      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
          reset: result.reset.toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(config.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.reset.toISOString(),
          },
        }
      );
    }

    // Add rate limit headers to successful response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(config.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', result.reset.toISOString());

    return null; // Continue to next middleware
  } catch (error) {
    // If rate limiting fails, log but allow request (fail open)
    logger.error('Rate limiting error', error instanceof Error ? error : undefined);
    return null;
  }
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// Legacy functions - kept for backward compatibility but not used anymore
// Rate limiting now uses Upstash Redis via @/lib/rate-limit
function getRateLimitBucket(pathname: string): string {
  if (pathname.startsWith('/api/auth')) return 'auth';
  if (pathname.startsWith('/api/')) return 'api';
  return 'public';
}

function getMaxRequests(pathname: string): number {
  if (pathname.startsWith('/api/auth')) return config.rateLimit.maxRequests.auth;
  if (pathname.startsWith('/api/')) return config.rateLimit.maxRequests.api;
  return config.rateLimit.maxRequests.public;
}

/**
 * CSRF Protection
 */
function shouldCheckCSRF(request: NextRequest, pathname: string): boolean {
  // Only check CSRF for mutations on non-webhook routes
  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (!mutationMethods.includes(request.method)) {
    return false;
  }

  // Skip CSRF for webhooks (they have their own verification)
  if (
    pathname.includes('/webhook') ||
    pathname.startsWith('/api/stripe') ||
    pathname.startsWith('/api/webhooks')
  ) {
    return false;
  }

  return pathname.startsWith('/api/');
}

function handleCSRF(request: NextRequest): NextResponse | null {
  const csrfToken = request.headers.get('x-csrf-token');
  // SECURITY FIX: Match backend cookie name (csrf_token, not csrf-token)
  const csrfCookie = request.cookies.get('csrf_token')?.value;

  // In development, skip CSRF (but log for awareness)
  if (process.env.NODE_ENV === 'development') {
    // Log in development to remind about production security
    if (process.env.ENABLE_CSRF_IN_DEV === 'true') {
      // Allow enabling CSRF in dev for testing
    } else {
      return null;
    }
  }

  // Skip if no CSRF cookie is set (first request)
  if (!csrfCookie) {
    return null;
  }

  // Validate token
  if (!csrfToken || csrfToken !== csrfCookie) {
    return new NextResponse(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Invalid or missing CSRF token',
        code: 'CSRF_ERROR',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}

/**
 * Bot Protection
 */
function isBot(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper',
    'curl', 'wget', 'python-requests',
    'headless', 'phantom', 'selenium',
  ];

  return botPatterns.some(pattern => userAgent.includes(pattern));
}

function handleBot(request: NextRequest, pathname: string): NextResponse {
  // Allow good bots on public pages
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const goodBots = ['googlebot', 'bingbot', 'yandex', 'duckduckbot'];
  
  const isGoodBot = goodBots.some(bot => userAgent.includes(bot));

  // Good bots can access public pages
  if (isGoodBot && !pathname.startsWith('/api/') && !pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // Block bots from API and protected routes
  if (pathname.startsWith('/api/') || pathname.startsWith('/dashboard') || pathname.startsWith('/overview')) {
    return new NextResponse(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Bot access not allowed',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.png, apple-touch-icon.png (favicon files)
     * - robots.txt, sitemap.xml (SEO files)
     * - public folder assets (images, etc.)
     * - manifest.json, sw.js, service-worker.js (PWA files)
     */
    '/((?!_next/static|_next/image|favicon\\.(ico|png)|apple-touch-icon\\.png|robots\\.txt|sitemap\\.xml|manifest\\.json|sw\\.js|service-worker\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
