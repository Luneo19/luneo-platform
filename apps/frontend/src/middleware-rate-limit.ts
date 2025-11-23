import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIdentifier, apiRateLimit } from '@/lib/rate-limit';

/**
 * Middleware pour appliquer le rate limiting sur les routes API
 */
export async function rateLimitMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclure certaines routes du rate limiting
  const excludedPaths = [
    '/api/stripe/webhook', // Stripe a son propre rate limiting
    '/api/auth/callback', // OAuth callbacks
  ];

  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return null; // Pas de rate limiting
  }

  // Appliquer le rate limiting sur les routes API
  if (pathname.startsWith('/api/')) {
    const identifier = getClientIdentifier(request);
    const { success, remaining, reset } = await checkRateLimit(identifier, apiRateLimit);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: `Trop de requêtes. Veuillez réessayer après ${reset.toLocaleTimeString()}.`,
          remaining: 0,
          reset: reset.toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toISOString(),
            'Retry-After': Math.ceil((reset.getTime() - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Ajouter les headers de rate limit à la réponse
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', reset.toISOString());

    return response;
  }

  return null; // Pas de rate limiting pour cette route
}

