import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/integrations/shopify/callback
 * Gère le callback OAuth de Shopify après authentification
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Récupérer les paramètres du callback
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');
    const hmac = searchParams.get('hmac');

    // Validation
    if (!code || !shop || !state) {
      throw {
        status: 400,
        message: 'Paramètres manquants dans le callback Shopify',
        code: 'VALIDATION_ERROR',
      };
    }

    // Vérifier l'état (CSRF protection)
    // L'état devrait correspondre à celui envoyé lors de l'initiation OAuth
    const { verifyOAuthState, deleteOAuthState } = await import('@/lib/oauth-state');
    
    if (!state) {
      logger.warn('OAuth callback missing state parameter', {
        shop,
        code,
      });
      throw {
        status: 400,
        message: 'Paramètre state manquant',
        code: 'MISSING_STATE',
      };
    }

    const oauthState = await verifyOAuthState(state, 'shopify');
    
    if (!oauthState) {
      logger.warn('Invalid or expired OAuth state', {
        shop,
        state,
      });
      throw {
        status: 400,
        message: 'État OAuth invalide ou expiré',
        code: 'INVALID_STATE',
      };
    }

    // Vérifier que l'utilisateur correspond
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn('Unauthorized Shopify callback attempt', {
        shop,
        state,
      });
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    logger.info('Shopify OAuth callback received', {
      userId: user.id,
      shop,
      state,
    });

    // Échanger le code contre un access token
    const shopifyApiKey = process.env.SHOPIFY_API_KEY;
    const shopifyApiSecret = process.env.SHOPIFY_API_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';

    if (!shopifyApiKey || !shopifyApiSecret) {
      logger.error('Shopify credentials not configured', new Error('Missing Shopify API credentials'));
      throw {
        status: 500,
        message: 'Configuration Shopify manquante',
        code: 'CONFIGURATION_ERROR',
      };
    }

    // Construire l'URL de token
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;

    let tokenResponse: Response;
    try {
      tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: shopifyApiKey,
          client_secret: shopifyApiSecret,
          code,
        }),
      });
    } catch (fetchError: any) {
      logger.error('Shopify token exchange fetch error', fetchError, {
        userId: user.id,
        shop,
      });
      throw {
        status: 500,
        message: 'Erreur lors de l\'échange du token Shopify',
        code: 'SHOPIFY_TOKEN_ERROR',
      };
    }

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error('Shopify token exchange failed', new Error(errorText), {
        userId: user.id,
        shop,
        status: tokenResponse.status,
      });
      throw {
        status: tokenResponse.status,
        message: 'Échec de l\'échange du token Shopify',
        code: 'SHOPIFY_TOKEN_ERROR',
      };
    }

    const tokenData = await tokenResponse.json();
    const { access_token, scope } = tokenData;

    if (!access_token) {
      throw {
        status: 500,
        message: 'Token d\'accès Shopify non reçu',
        code: 'SHOPIFY_TOKEN_ERROR',
      };
    }

    // Sauvegarder l'intégration Shopify
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .upsert(
        {
          user_id: user.id,
          platform: 'shopify',
          shop_domain: shop,
          access_token: access_token, // En production, chiffrer ce token
          scope: scope,
          status: 'connected',
          connected_at: new Date().toISOString(),
          metadata: {
            state,
            hmac,
          },
        },
        {
          onConflict: 'user_id,platform,shop_domain',
        }
      )
      .select()
      .single();

    if (integrationError) {
      logger.dbError('save Shopify integration', integrationError, {
        userId: user.id,
        shop,
      });
      throw { status: 500, message: 'Erreur lors de la sauvegarde de l\'intégration' };
    }

    // Configurer les webhooks Shopify (non bloquant)
    try {
      await configureShopifyWebhooks(shop, access_token, user.id);
    } catch (webhookError: any) {
      logger.warn('Failed to configure Shopify webhooks', {
        userId: user.id,
        shop,
        error: webhookError,
      });
      // Ne pas bloquer la connexion si les webhooks échouent
    }

    logger.info('Shopify integration connected', {
      userId: user.id,
      shop,
      integrationId: integration.id,
    });

    // Rediriger vers la page de succès
    return {
      success: true,
      integration: {
        id: integration.id,
        platform: integration.platform,
        shop_domain: integration.shop_domain,
        status: integration.status,
      },
      redirectUrl: `${appUrl}/dashboard/integrations?connected=shopify`,
    };
  }, '/api/integrations/shopify/callback', 'GET');
}

/**
 * Configure les webhooks Shopify
 */
async function configureShopifyWebhooks(
  shop: string,
  accessToken: string,
  userId: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.luneo.app';
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || '';

  const webhooks = [
    {
      topic: 'orders/create',
      address: `${appUrl}/api/webhooks/ecommerce`,
    },
    {
      topic: 'orders/updated',
      address: `${appUrl}/api/webhooks/ecommerce`,
    },
    {
      topic: 'orders/paid',
      address: `${appUrl}/api/webhooks/ecommerce`,
    },
    {
      topic: 'products/create',
      address: `${appUrl}/api/webhooks/ecommerce`,
    },
    {
      topic: 'products/update',
      address: `${appUrl}/api/webhooks/ecommerce`,
    },
  ];

  for (const webhook of webhooks) {
    try {
      await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          webhook: {
            topic: webhook.topic,
            address: webhook.address,
            format: 'json',
          },
        }),
      });
    } catch (webhookError: any) {
      logger.warn('Failed to create Shopify webhook', {
        userId,
        shop,
        topic: webhook.topic,
        error: webhookError,
      });
    }
  }
}
