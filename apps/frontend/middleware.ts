import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Inline config for Edge
const SUPPORTED_LOCALES = ['en', 'fr', 'de'] as const;
const LOCALE_COOKIE = 'luneo_locale';
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const supportedLocaleSet = new Set<SupportedLocale>(SUPPORTED_LOCALES);

/**
 * Middleware Next.js simplifié
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/test'
  ) {
    return response;
  }

  // Security headers
  const securityHeaders = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Locale handling
  const requestedLocale = request.nextUrl.searchParams.get('lang');
  if (requestedLocale && supportedLocaleSet.has(requestedLocale as SupportedLocale)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete('lang');
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.cookies.set(LOCALE_COOKIE, requestedLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return redirectResponse;
  }

  // Protected routes - check auth only if Supabase is configured
  const protectedPaths = [
    '/overview', '/analytics', '/orders', '/products', '/templates',
    '/billing', '/settings', '/team', '/plans', '/library',
  ];

  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isProtectedPath) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createServerClient(supabaseUrl, supabaseKey, {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: Record<string, unknown>) {
              request.cookies.set({ name, value, ...options });
              response.cookies.set({ name, value, ...options });
            },
            remove(name: string, options: Record<string, unknown>) {
              request.cookies.set({ name, value: '', ...options });
              response.cookies.set({ name, value: '', ...options });
            },
          },
        });

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          const redirectUrl = new URL('/login', request.url);
          redirectUrl.searchParams.set('redirect', pathname);
          return NextResponse.redirect(redirectUrl);
        }
      } catch (error) {
        console.error('Middleware auth error:', error);
        // Continue without blocking on error
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
