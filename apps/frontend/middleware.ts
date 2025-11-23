import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { LOCALE_COOKIE, SUPPORTED_LOCALES } from '@/i18n/config';

const supportedLocaleSet = new Set(SUPPORTED_LOCALES);

/**
 * Middleware Next.js - Gestion complète des requêtes
 * TODO-049: Headers sécurité, CSP, authentification, rate limiting
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  const requestedLocale = request.nextUrl.searchParams.get('lang');
  if (requestedLocale && supportedLocaleSet.has(requestedLocale as (typeof SUPPORTED_LOCALES)[number])) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete('lang');
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(LOCALE_COOKIE, requestedLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    });
    return response;
  }

  // ============================================
  // 1. RATE LIMITING (si Upstash est configuré)
  // ============================================
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { rateLimitMiddleware } = await import('@/middleware-rate-limit');
      const rateLimitResponse = await rateLimitMiddleware(request);
      if (rateLimitResponse) {
        if (requestedLocale && supportedLocaleSet.has(requestedLocale as (typeof SUPPORTED_LOCALES)[number])) {
          rateLimitResponse.cookies.set(LOCALE_COOKIE, requestedLocale, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'lax',
          });
        }
        return rateLimitResponse;
      }
    } catch (error) {
      console.warn('⚠️ Rate limiting non disponible:', error);
    }
  }

  // ============================================
  // 2. AUTHENTICATION (Supabase)
  // ============================================

  const protectedPaths = [
    '/overview',
    '/analytics',
    '/orders',
    '/products',
    '/templates',
    '/billing',
    '/settings',
    '/team',
    '/plans',
    '/library',
    '/integrations-dashboard',
    '/ai-studio',
    '/ai-studio/luxury',
    '/virtual-try-on',
    '/ar-studio',
    '/monitoring',
    '/configure-3d',
    '/customize',
    '/3d-view',
    '/try-on',
    '/share',
  ];

  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/auth/callback',
    '/api/auth/google',
    '/api/auth/github',
    '/api/stripe/webhook',
    '/api/newsletter/subscribe',
  ];

  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const isExplicitPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  const withLocaleCookie = (response: NextResponse) => {
    if (requestedLocale && supportedLocaleSet.has(requestedLocale as (typeof SUPPORTED_LOCALES)[number])) {
      response.cookies.set(LOCALE_COOKIE, requestedLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    }
    return response;
  };

  // ============================================
  // 3. SECURITY HEADERS (TODO-049)
  // ============================================
  const securityHeaders = {
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '1; mode=block',
  };

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel-insights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://*.vercel.app https://api.luneo.app wss://*.supabase.co",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  // Appliquer les headers de sécurité
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  response.headers.set('Content-Security-Policy', cspDirectives);

  // ============================================
  // 4. AUTHENTICATION (Supabase)
  // ============================================

  // If it's an API route, let it pass (API routes handle their own auth)
  if (pathname.startsWith('/api/')) {
    const apiResponse = withLocaleCookie(response);
    const supabase = createClient(request, apiResponse);
    await supabase.auth.getUser();
    return apiResponse;
  }

  if (!isProtectedPath || isExplicitPublicPath) {
    return withLocaleCookie(response);
  }

  // For protected routes, check authentication
  const protectedResponse = withLocaleCookie(response);
  const supabase = createClient(request, protectedResponse);
  const { data: { user } } = await supabase.auth.getUser();

  // If no user, redirect to login
  if (!user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
    const redirectResponse = withLocaleCookie(NextResponse.redirect(redirectUrl));
    // Appliquer les headers de sécurité même sur la redirection
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value);
    });
    redirectResponse.headers.set('Content-Security-Policy', cspDirectives);
    return redirectResponse;
  }

  return protectedResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any public API routes that don't need auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

