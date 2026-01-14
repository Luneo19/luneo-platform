/**
 * ★★★ MIDDLEWARE - PRODUCT GUARD ★★★
 * Guards pour protéger les routes de produits
 * - Vérification permissions
 * - Validation données
 * - Brand ownership
 */

import { getUserFromRequest } from '@/lib/auth/get-user';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// ========================================
// TYPES
// ========================================

export interface ProductGuardOptions {
  requireAuth?: boolean;
  requireBrand?: boolean;
  requireOwnership?: boolean;
  allowedMethods?: string[];
}

// ========================================
// GUARD
// ========================================

export class ProductGuard {
  /**
   * Vérifie les permissions et valide la requête
   */
  static async check(
    request: NextRequest,
    options: ProductGuardOptions = {}
  ): Promise<{ allowed: boolean; error?: string; statusCode?: number }> {
    const {
      requireAuth = true,
      requireBrand = true,
      requireOwnership = false,
      allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'],
    } = options;

    try {
      // 1. Check method
      if (!allowedMethods.includes(request.method)) {
        return {
          allowed: false,
          error: `Méthode ${request.method} non autorisée`,
          statusCode: 405,
        };
      }

      // 2. Check authentication
      let user: { id: string; email: string; role?: string; brandId?: string } | null = null;
      if (requireAuth) {
        user = await getUserFromRequest(request);
        if (!user) {
          return { allowed: false, error: 'Non authentifié', statusCode: 401 };
        }
      }

      // 3. Check brand
      if (requireBrand) {
        if (!user) {
          user = await getUserFromRequest(request);
        }
        if (!user || !user.brandId) {
          return { allowed: false, error: 'Marque requise', statusCode: 403 };
        }
      }

      // 4. Check ownership (for update/delete)
      if (requireOwnership && ['PUT', 'DELETE'].includes(request.method)) {
        if (!user) {
          user = await getUserFromRequest(request);
        }
        if (!user) {
          return { allowed: false, error: 'Non authentifié', statusCode: 401 };
        }

        // Get product ID from URL params or body
        const productId = request.nextUrl.searchParams.get('id') || 
                         (await request.json().catch(() => ({}))).id;

        if (!productId) {
          return { allowed: false, error: 'ID produit requis', statusCode: 400 };
        }

        const product = await db.product.findUnique({
          where: { id: productId },
          select: { brandId: true },
        });

        if (!product) {
          return { allowed: false, error: 'Produit introuvable', statusCode: 404 };
        }

        if (product.brandId !== user.brandId) {
          return { allowed: false, error: 'Accès non autorisé', statusCode: 403 };
        }
      }

      // 5. Validate request body (for POST/PUT)
      if (['POST', 'PUT'].includes(request.method)) {
        try {
          const body = await request.json();

          // Validate required fields
          if (request.method === 'POST' && !body.name) {
            return {
              allowed: false,
              error: 'name requis',
              statusCode: 400,
            };
          }

          // Validate category
          if (body.category && !['JEWELRY', 'WATCHES', 'GLASSES', 'ACCESSORIES', 'HOME', 'TECH', 'OTHER'].includes(body.category)) {
            return {
              allowed: false,
              error: 'category invalide',
              statusCode: 400,
            };
          }
        } catch (error) {
          // Body might be empty, that's ok for some endpoints
        }
      }

      return { allowed: true };
    } catch (error: any) {
      logger.error('Error in product guard', { error });
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
    options?: ProductGuardOptions
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const check = await ProductGuard.check(request, options);

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

