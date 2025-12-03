/**
 * Security Middleware
 * Audit sécurité complet : Headers, CORS, Rate Limiting, CSRF
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
      'https://app.luneo.app',
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
    '/dashboard',
    '/settings',
    '/billing',
    '/team',
    '/api/designs',
    '/api/billing',
    '/api/team',
    '/api/profile',
    '/api/settings',
    '/api/notifications',
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. Security Headers
  setSecurityHeaders(response);

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

  return response;
}

/**
 * Set security headers
 */
function setSecurityHeaders(response: NextResponse): void {
  // Strict Transport Security
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co https://*.sentry.io wss://*.supabase.co https://www.google-analytics.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

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
 */
async function handleRateLimit(
  request: NextRequest,
  pathname: string
): Promise<NextResponse | null> {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  const ip = getClientIP(request);
  const key = `${ip}:${getRateLimitBucket(pathname)}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);

  // Reset if window expired
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + config.rateLimit.windowMs,
    };
  }

  record.count++;
  rateLimitStore.set(key, record);

  // Get limit for this bucket
  const maxRequests = getMaxRequests(pathname);

  if (record.count > maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);

    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(record.resetTime),
        },
      }
    );
  }

  return null;
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

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
  const csrfCookie = request.cookies.get('csrf-token')?.value;

  // In development, skip CSRF
  if (process.env.NODE_ENV === 'development') {
    return null;
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
  if (pathname.startsWith('/api/') || pathname.startsWith('/dashboard')) {
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
export const middlewareConfig = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

