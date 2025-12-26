import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

/**
 * GET /api/integrations/shopify/connect
 * Initie le flux OAuth Shopify
 */
export async function GET(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop'); // ex: monshop.myshopify.com

    // Validation
    if (!shop) {
      throw {
        status: 400,
        message: 'Paramètre shop manquant',
        code: 'VALIDATION_ERROR',
      };
    }

    // Valider le format du shop
    if (!shop.endsWith('.myshopify.com')) {
      throw {
        status: 400,
        message: 'Format de shop invalide (doit se terminer par .myshopify.com)',
        code: 'VALIDATION_ERROR',
      };
    }

    const clientId = process.env.SHOPIFY_CLIENT_ID;
    if (!clientId) {
      logger.error('SHOPIFY_CLIENT_ID not configured', new Error('Missing SHOPIFY_CLIENT_ID'));
      throw {
        status: 500,
        message: 'Configuration Shopify manquante',
        code: 'CONFIGURATION_ERROR',
      };
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app'}/api/integrations/shopify/callback`;
    
    // Scopes Shopify requis
    const scopes = [
      'read_products',
      'write_products',
      'read_inventory',
      'write_inventory',
      'read_orders',
      'read_customers',
    ].join(',');

    // Générer un state pour CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Sauvegarder le state temporairement (vous pouvez utiliser Redis ou la session)
    // Pour simplifier, on le passe dans l'URL et on vérifie côté callback

    // Construire l'URL d'autorisation Shopify
    const authUrl = `https://${shop}/admin/oauth/authorize?` + new URLSearchParams({
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      state: `${state}:${user.id}`, // State contient user_id pour le callback
    }).toString();

    logger.info('Shopify OAuth initiated', {
      userId: user.id,
      shop,
    });

    // Rediriger vers Shopify pour autorisation
    return NextResponse.redirect(authUrl);
  }, '/api/integrations/shopify/connect', 'GET');
}
