import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { connectWooCommerceSchema } from '@/lib/validation/zod-schemas';

/**
 * POST /api/integrations/woocommerce/connect
 * Connecte un store WooCommerce
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(connectWooCommerceSchema, request, async (validatedData) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { store_url, consumer_key, consumer_secret } = validatedData;

    // Vérifier les credentials avec WooCommerce API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    let verifyResponse: Response;

    try {
      verifyResponse = await fetch(`${backendUrl}/api/integrations/woocommerce/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.INTERNAL_API_KEY || ''}`,
        },
        body: JSON.stringify({
          store_url,
          consumer_key,
          consumer_secret,
        }),
      });
    } catch (fetchError: any) {
      logger.error('WooCommerce verification service fetch error', fetchError, {
        userId: user.id,
        storeUrl: store_url,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la vérification des credentials WooCommerce',
        code: 'WOOCOMMERCE_VERIFICATION_ERROR',
      };
    }

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      logger.error('WooCommerce verification failed', new Error(errorText), {
        userId: user.id,
        storeUrl: store_url,
        status: verifyResponse.status,
      });
      throw {
        status: verifyResponse.status,
        message: 'Credentials WooCommerce invalides',
        code: 'WOOCOMMERCE_INVALID_CREDENTIALS',
      };
    }

    const verifyData = await verifyResponse.json();

    // Vérifier si l'intégration existe déjà
    const { data: existingIntegration, error: checkError } = await supabase
      .from('integrations')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('service', 'woocommerce')
      .eq('config->>store_url', store_url)
      .single();

    let integration;

    if (existingIntegration) {
      // Mettre à jour l'intégration existante
      const { data: updated, error: updateError } = await supabase
        .from('integrations')
        .update({
          credentials: {
            consumer_key,
            consumer_secret,
          },
          config: {
            store_url,
            store_name: verifyData.store_name || null,
            store_version: verifyData.store_version || null,
          },
          status: 'connected',
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingIntegration.id)
        .select()
        .single();

      if (updateError) {
        logger.dbError('update WooCommerce integration', updateError, {
          userId: user.id,
          integrationId: existingIntegration.id,
        });
        throw { status: 500, message: 'Erreur lors de la mise à jour de l\'intégration' };
      }

      integration = updated;
    } else {
      // Créer une nouvelle intégration
      const { data: created, error: createError } = await supabase
        .from('integrations')
        .insert({
          user_id: user.id,
          service: 'woocommerce',
          credentials: {
            consumer_key,
            consumer_secret,
          },
          config: {
            store_url,
            store_name: verifyData.store_name || null,
            store_version: verifyData.store_version || null,
          },
          status: 'connected',
          connected_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        logger.dbError('create WooCommerce integration', createError, {
          userId: user.id,
          storeUrl: store_url,
        });
        throw { status: 500, message: 'Erreur lors de la création de l\'intégration' };
      }

      integration = created;
    }

    logger.info('WooCommerce integration connected', {
      userId: user.id,
      integrationId: integration.id,
      storeUrl: store_url,
    });

    return ApiResponseBuilder.success({
      integration: {
        ...integration,
        credentials: undefined, // Ne pas exposer les credentials
      },
    }, 'Store WooCommerce connecté avec succès', 201);
  });
}
