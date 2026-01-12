/**
 * Security Middleware
 * Audit sécurité complet : Headers, CORS, Rate Limiting, CSRF
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateNonce, buildCSPWithNonce } from '@/lib/security/csp-nonce';

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
      'https://luneo.app',
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
    '/overview',
    '/settings',
    '/billing',
    '/team',
    '/ai-studio',
    '/api/designs',
    '/api/billing',
    '/api/team',
    '/api/profile',
    '/api/settings',
    '/api/notifications',
    '/api/ai',
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

  // Content Security Policy with nonce (if provided)
  // Nonces provide better security than 'unsafe-inline'
  let csp: string;
  
  if (nonce && process.env.NODE_ENV === 'production') {
    // Use nonce-based CSP in production for better security
    csp = buildCSPWithNonce(nonce);
  } else {
    // Fallback to inline CSP (for development or if nonce not available)
    csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com data:",
      "connect-src 'self' https://api.stripe.com https://*.supabase.co https://*.sentry.io wss://*.supabase.co https://www.google-analytics.com https://vitals.vercel-insights.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'self'",
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
    
    const identifier = getClientIdentifier(request as any);
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
    console.error('Rate limiting error:', error);
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
  const csrfCookie = request.cookies.get('csrf-token')?.value;

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
