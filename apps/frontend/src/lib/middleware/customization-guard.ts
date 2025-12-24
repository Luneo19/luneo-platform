/**
 * ★★★ MIDDLEWARE - CUSTOMIZATION GUARD ★★★
 * Guards pour protéger les routes de personnalisation
 * - Vérification permissions
 * - Validation données
 * - Rate limiting
 */

import { logger } from '@/lib/logger';
import type { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/get-user';

// ========================================
// TYPES
// ========================================

export interface CustomizationGuardOptions {
  requireAuth?: boolean;
  requireProduct?: boolean;
  requireZone?: boolean;
  maxPromptLength?: number;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

// ========================================
// RATE LIMITER
// ========================================

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  check(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests
    const validRequests = requests.filter((time) => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return false;
    }

    // Add new request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  reset(key: string) {
    this.requests.delete(key);
  }
}

const rateLimiter = new RateLimiter();

// ========================================
// GUARD
// ========================================

export class CustomizationGuard {
  /**
   * Vérifie les permissions et valide la requête
   */
  static async check(
    request: NextRequest,
    options: CustomizationGuardOptions = {}
  ): Promise<{ allowed: boolean; error?: string; statusCode?: number }> {
    const {
      requireAuth = true,
      requireProduct = true,
      requireZone = true,
      maxPromptLength = 500,
      rateLimit,
    } = options;

    try {
      // 1. Check authentication
      if (requireAuth) {
        const user = await getUserFromRequest(request);
        if (!user) {
          return { allowed: false, error: 'Non authentifié', statusCode: 401 };
        }
      }

      // 2. Parse request body
      let body: any = {};
      try {
        body = await request.json();
      } catch (error) {
        // Body might be empty, that's ok
      }

      // 3. Check required fields
      if (requireProduct && !body.productId) {
        return {
          allowed: false,
          error: 'productId requis',
          statusCode: 400,
        };
      }

      if (requireZone && !body.zoneId) {
        return {
          allowed: false,
          error: 'zoneId requis',
          statusCode: 400,
        };
      }

      // 4. Validate prompt
      if (body.prompt) {
        if (typeof body.prompt !== 'string') {
          return {
            allowed: false,
            error: 'prompt doit être une chaîne de caractères',
            statusCode: 400,
          };
        }

        if (body.prompt.length > maxPromptLength) {
          return {
            allowed: false,
            error: `prompt trop long (max ${maxPromptLength} caractères)`,
            statusCode: 400,
          };
        }

        if (body.prompt.trim().length === 0) {
          return {
            allowed: false,
            error: 'prompt ne peut pas être vide',
            statusCode: 400,
          };
        }
      }

      // 5. Rate limiting
      if (rateLimit) {
        const clientId = request.headers.get('x-forwarded-for') || 'unknown';
        const key = `customization:${clientId}`;

        const allowed = rateLimiter.check(
          key,
          rateLimit.maxRequests,
          rateLimit.windowMs
        );

        if (!allowed) {
          return {
            allowed: false,
            error: 'Trop de requêtes, veuillez réessayer plus tard',
            statusCode: 429,
          };
        }
      }

      return { allowed: true };
    } catch (error: any) {
      logger.error('Error in customization guard', { error });
      return {
        allowed: false,
        error: 'Erreur lors de la validation',
        statusCode: 500,
      };
    }
  }

  /**
   * Wrapper pour protéger une route handler
   */
  static protect(
    handler: (request: NextRequest) => Promise<NextResponse>,
    options?: CustomizationGuardOptions
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const check = await CustomizationGuard.check(request, options);

      if (!check.allowed) {
        return new NextResponse(
          JSON.stringify({ error: check.error }),
          {
            status: check.statusCode || 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return handler(request);
    };
  }
}

