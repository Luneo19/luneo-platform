import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { syncShopifySchema, idSchema, z } from '@/lib/validation/zod-schemas';
import { decrypt } from '@/lib/encryption';

/**
 * POST /api/integrations/shopify/sync
 * Synchronise les produits depuis Shopify vers Luneo
 */
export async function POST(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const startTime = Date.now();
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    
    // Validation Zod
    const validation = syncShopifySchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { integrationId, direction = 'import' } = validation.data;

    // Récupérer l'intégration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      logger.warn('Shopify sync attempt with non-existent integration', {
        integrationId,
        userId: user.id,
      });
      throw { status: 404, message: 'Intégration non trouvée', code: 'INTEGRATION_NOT_FOUND' };
    }

    if (integration.platform !== 'shopify') {
      throw {
        status: 400,
        message: 'Cette intégration n\'est pas Shopify',
        code: 'INVALID_PLATFORM',
      };
    }

    // Déchiffrer le token
    let accessToken: string;
    try {
      accessToken = decrypt(integration.oauth_access_token);
    } catch (decryptError: any) {
      logger.error('Error decrypting Shopify token', decryptError, {
        integrationId,
        userId: user.id,
      });
      throw {
        status: 500,
        message: 'Erreur lors du déchiffrement du token',
        code: 'DECRYPTION_ERROR',
      };
    }

    // Créer un log de sync
    const { data: syncLog, error: logError } = await supabase
      .from('sync_logs')
      .insert({
        integration_id: integrationId,
        sync_type: 'manual',
        direction: direction,
        status: 'started',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      logger.dbError('create sync log', logError, {
        integrationId,
        userId: user.id,
      });
      // Ne pas bloquer la sync si le log échoue
    }

    // Récupérer les produits depuis Shopify
    let shopifyProducts: any[];
    try {
      shopifyProducts = await fetchShopifyProducts(integration.store_url, accessToken);
    } catch (fetchError: any) {
      logger.error('Error fetching Shopify products', fetchError, {
        integrationId,
        userId: user.id,
        storeUrl: integration.store_url,
      });

      // Mettre à jour le log de sync en cas d'erreur
      if (syncLog) {
        await supabase
          .from('sync_logs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            errors: [{ message: fetchError.message }],
          })
          .eq('id', syncLog.id);
      }

      throw {
        status: 500,
        message: `Erreur lors de la récupération des produits Shopify: ${fetchError.message}`,
        code: 'SHOPIFY_API_ERROR',
      };
    }

    let succeeded = 0;
    let failed = 0;
    let updated = 0;
    let created = 0;
    const errors: any[] = [];

    // Synchroniser chaque produit
    for (const shopifyProduct of shopifyProducts) {
      try {
        // Vérifier si le produit existe déjà
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', user.id)
          .eq('metadata->shopify_id', shopifyProduct.id.toString())
          .single();

        const productData = {
          user_id: user.id,
          name: shopifyProduct.title,
          description: shopifyProduct.body_html || '',
          base_price: parseFloat(shopifyProduct.variants[0]?.price || '0') * 100, // Convertir en centimes
          currency: integration.store_currency || 'EUR',
          sku: shopifyProduct.variants[0]?.sku || null,
          stock: shopifyProduct.variants[0]?.inventory_quantity || 0,
          images: shopifyProduct.images?.map((img: any) => img.src) || [],
          is_active: shopifyProduct.status === 'active',
          metadata: {
            shopify_id: shopifyProduct.id,
            shopify_handle: shopifyProduct.handle,
            vendor: shopifyProduct.vendor,
            product_type: shopifyProduct.product_type,
            tags: shopifyProduct.tags,
            synced_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        };

        if (existingProduct) {
          // Mettre à jour le produit existant
          const { error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existingProduct.id);

          if (updateError) {
            throw updateError;
          }
          updated++;
        } else {
          // Créer un nouveau produit
          const { error: insertError } = await supabase
            .from('products')
            .insert({
              ...productData,
              created_at: new Date().toISOString(),
            });

          if (insertError) {
            throw insertError;
          }
          created++;
        }

        succeeded++;
      } catch (err: any) {
        failed++;
        errors.push({
          product_id: shopifyProduct.id,
          product_title: shopifyProduct.title,
          error: err.message,
        });
        logger.error('Error syncing Shopify product', err, {
          productId: shopifyProduct.id,
          productTitle: shopifyProduct.title,
          userId: user.id,
        });
      }
    }

    // Mettre à jour le log de sync
    const duration = Date.now() - startTime;
    
    if (syncLog) {
      await supabase
        .from('sync_logs')
        .update({
          status: failed === 0 ? 'success' : (succeeded > 0 ? 'partial' : 'failed'),
          items_total: shopifyProducts.length,
          items_processed: shopifyProducts.length,
          items_succeeded: succeeded,
          items_failed: failed,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          summary: {
            products_imported: succeeded,
            products_updated: updated,
            products_created: created,
          },
          errors: errors.length > 0 ? errors : null,
        })
        .eq('id', syncLog.id);
    }

    logger.info('Shopify sync completed', {
      integrationId,
      userId: user.id,
      total: shopifyProducts.length,
      succeeded,
      failed,
      duration,
    });

    return ApiResponseBuilder.success({
      total: shopifyProducts.length,
      succeeded,
      failed,
      updated,
      created,
      duration_ms: duration,
      errors: errors.length > 0 ? errors : null,
    }, 'Synchronisation Shopify terminée avec succès');
  }, '/api/integrations/shopify/sync', 'POST');
}

/**
 * GET /api/integrations/shopify/sync
 * Récupère l'historique des synchronisations
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
    const integrationId = searchParams.get('integration_id');
    const { page, limit, offset } = getPaginationParams(searchParams);

    // Validation Zod pour le paramètre integration_id
    const idValidation = z.object({ integration_id: idSchema }).safeParse({ integration_id: integrationId });
    
    if (!idValidation.success) {
      throw {
        status: 400,
        message: 'Le paramètre integration_id est requis et doit être un UUID valide',
        code: 'VALIDATION_ERROR',
        details: idValidation.error.issues,
      };
    }

    // Récupérer les logs de sync
    const validatedIntegrationId = idValidation.data.integration_id;
    const { data: logs, error: logsError, count } = await supabase
      .from('sync_logs')
      .select('*', { count: 'exact' })
      .eq('integration_id', validatedIntegrationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      logger.dbError('fetch sync logs', logsError, {
        integrationId: validatedIntegrationId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération des logs' };
    }

    return ApiResponseBuilder.success({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  }, '/api/integrations/shopify/sync', 'GET');
}

/**
 * Récupère tous les produits depuis Shopify
 */
async function fetchShopifyProducts(shop: string, accessToken: string): Promise<any[]> {
  const products: any[] = [];
  let page = 1;
  let hasMore = true;
  const maxPages = 100; // Limite de sécurité

  while (hasMore && page <= maxPages) {
    try {
      const url = `https://${shop}/admin/api/2024-10/products.json?limit=250&page=${page}`;
      
      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      products.push(...(data.products || []));

      // Shopify pagination
      hasMore = data.products && data.products.length === 250;
      page++;
    } catch (error: any) {
      logger.error('Error fetching Shopify products page', error, {
        shop,
        page,
      });
      throw error;
    }
  }

  return products;
}
