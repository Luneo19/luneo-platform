import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/integrations/shopify/connect
 * Initie le flux OAuth Shopify
 * Forward vers backend NestJS: POST /api/ecommerce/shopify/install
 * Note: Le backend gère l'OAuth flow, cette route peut rediriger vers le backend
 * ou utiliser POST /ecommerce/shopify/install avec les paramètres
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      throw {
        status: 400,
        message: 'Paramètre shop manquant',
        code: 'VALIDATION_ERROR',
      };
    }

    if (!shop.endsWith('.myshopify.com')) {
      throw {
        status: 400,
        message: 'Format de shop invalide (doit se terminer par .myshopify.com)',
        code: 'VALIDATION_ERROR',
      };
    }

    // Le backend gère l'installation Shopify via POST /ecommerce/shopify/install
    // Cette route génère l'URL d'installation OAuth
    const result = await forwardPost('/ecommerce/shopify/install', request, {
      shop,
      brandId: null, // Sera récupéré depuis le token JWT dans le backend
    });
    return result.data;
  }, '/api/integrations/shopify/connect', 'GET');
}
