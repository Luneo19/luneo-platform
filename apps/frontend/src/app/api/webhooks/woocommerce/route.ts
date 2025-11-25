import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { decrypt } from '@/lib/encryption';
import { logger } from '@/lib/logger';
import { ApiResponseBuilder } from '@/lib/api-response';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  WooCommerceOrder,
  WooCommerceProduct,
  WooCommerceWebhookResult,
  WooCommerceIntegration,
} from '@/types/woocommerce';

/**
 * POST /api/webhooks/woocommerce
 * Reçoit les webhooks WooCommerce et met à jour les commandes/statuts
 * 
 * Gestion complète des webhooks WooCommerce :
 * - Orders: created, updated, paid, completed, cancelled
 * - Products: created, updated, deleted
 * - Validation signature HMAC SHA256
 * - Synchronisation bidirectionnelle
 * - Génération automatique fichiers de production
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.text();
    const signature = request.headers.get('x-wc-webhook-signature');
    const topic = request.headers.get('x-wc-webhook-topic');
    const storeUrl = request.headers.get('x-wc-webhook-store-url');
    const resource = request.headers.get('x-wc-webhook-resource');

    // Validation des headers requis
    if (!signature || !topic) {
      throw {
        status: 400,
        message: 'Signature ou topic manquant',
        code: 'MISSING_HEADERS',
      };
    }

    logger.info('WooCommerce webhook received', {
      topic,
      resource,
      storeUrl,
      signatureLength: signature.length,
    });

    // Récupérer l'intégration WooCommerce pour ce store
    const supabase = await createClient();
    
    let integration: WooCommerceIntegration | null = null;
    if (storeUrl) {
      const { data } = await supabase
        .from('integrations')
        .select('*')
        .eq('platform', 'woocommerce')
        .eq('store_url', storeUrl)
        .eq('is_active', true)
        .single();
      
      integration = data as WooCommerceIntegration | null;
    } else {
      // Si pas de store_url dans header, chercher la première intégration active
      const { data } = await supabase
        .from('integrations')
        .select('*')
        .eq('platform', 'woocommerce')
        .eq('is_active', true)
        .limit(1)
        .single();
      
      integration = data as WooCommerceIntegration | null;
    }

    if (!integration) {
      logger.warn('Aucune intégration WooCommerce active trouvée', { storeUrl });
      throw {
        status: 404,
        message: 'Intégration WooCommerce non trouvée',
        code: 'INTEGRATION_NOT_FOUND',
      };
    }

    // Vérifier la signature du webhook
    // WooCommerce utilise HMAC SHA256 avec le consumer_secret
    const consumerSecret = decrypt(
      (integration.credentials as { consumer_secret?: string })?.consumer_secret || ''
    );
    
    if (!consumerSecret) {
      logger.warn('Consumer secret manquant pour l\'intégration WooCommerce', {
        integrationId: integration.id,
        storeUrl,
      });
      throw {
        status: 401,
        message: 'Credentials invalides',
        code: 'INVALID_CREDENTIALS',
      };
    }

    const hash = crypto
      .createHmac('sha256', consumerSecret)
      .update(body, 'utf8')
      .digest('base64');

    if (hash !== signature) {
      logger.webhookError('woocommerce', topic || 'unknown', new Error(`Invalid signature - integrationId: ${integration.id}, storeUrl: ${storeUrl}`));
      throw {
        status: 401,
        message: 'Signature invalide',
        code: 'INVALID_SIGNATURE',
      };
    }

    // Parser le body JSON
    let data: WooCommerceOrder | WooCommerceProduct;
    try {
      const parsed = JSON.parse(body);
      
      // Validation basique des données
      if (!parsed || typeof parsed !== 'object' || !('id' in parsed)) {
        throw {
          status: 400,
          message: 'Données webhook invalides',
          code: 'INVALID_DATA',
        };
      }
      
      data = parsed as WooCommerceOrder | WooCommerceProduct;
    } catch (parseError) {
      const error = parseError instanceof Error ? parseError : new Error(String(parseError));
      logger.error('Invalid JSON body in WooCommerce webhook', error, {
        topic,
        storeUrl,
        bodyLength: body.length,
      });
      
      if (typeof parseError === 'object' && parseError !== null && 'status' in parseError) {
        throw parseError;
      }
      
      throw {
        status: 400,
        message: 'Body JSON invalide',
        code: 'INVALID_JSON',
      };
    }

    logger.info('Processing WooCommerce webhook', {
      topic,
      resourceId: data.id,
      storeUrl,
    });

    // Traiter selon le topic
    let result: WooCommerceWebhookResult | undefined;
    switch (topic) {
      case 'order.created':
        result = await handleOrderCreated(supabase, data as WooCommerceOrder, integration);
        break;

      case 'order.updated':
        result = await handleOrderUpdated(supabase, data as WooCommerceOrder, integration);
        break;

      case 'order.paid':
        result = await handleOrderPaid(supabase, data as WooCommerceOrder, integration);
        break;

      case 'order.completed':
        result = await handleOrderCompleted(supabase, data as WooCommerceOrder, integration);
        break;

      case 'order.cancelled':
        result = await handleOrderCancelled(supabase, data as WooCommerceOrder, integration);
        break;

      case 'order.refunded':
        if ('id' in data && 'status' in data) {
          result = await handleOrderRefunded(supabase, data as WooCommerceOrder, integration);
        }
        break;

      case 'product.created':
      case 'product.updated':
        if ('id' in data && 'name' in data) {
          result = await handleProductUpdated(supabase, data as WooCommerceProduct, integration);
        }
        break;

      case 'product.deleted':
        if ('id' in data && 'name' in data) {
          result = await handleProductDeleted(supabase, data as WooCommerceProduct, integration);
        }
        break;

      case 'stock.updated':
        // Stock updates sont généralement des produits
        if ('id' in data && 'name' in data) {
          result = await handleStockUpdated(supabase, data as WooCommerceProduct, integration);
        }
        break;

      default:
        logger.info(`Topic WooCommerce non géré: ${topic}`, { topic, resourceId: data.id });
        return {
          success: true,
          message: `Topic ${topic} non géré`,
          topic,
        };
    }

    logger.info('WooCommerce webhook processed successfully', {
      topic,
      resourceId: data.id,
      storeUrl,
    });

    return {
      success: true,
      topic,
      resourceId: data.id,
      ...(result && { result }),
    };
  }, '/api/webhooks/woocommerce', 'POST');
}

/**
 * Gérer la création d'une commande WooCommerce
 */
async function handleOrderCreated(
  supabase: SupabaseClient,
  orderData: WooCommerceOrder,
  integration: WooCommerceIntegration
): Promise<WooCommerceWebhookResult> {
  try {
    logger.info(`Commande WooCommerce créée: ${orderData.id}`, { orderId: orderData.id });

    // Validation des données requises
    if (!orderData.id) {
      throw new Error('Order ID manquant');
    }

    // Mapper les statuts WooCommerce vers Luneo
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'processing': 'processing',
      'on-hold': 'on_hold',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'failed': 'failed',
    };

    const luneoStatus = statusMap[orderData.status] || 'pending';

    // Créer ou mettre à jour la commande dans Luneo
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('external_id', orderData.id.toString())
      .eq('platform', 'woocommerce')
      .single();

    const orderPayload = {
      external_id: orderData.id.toString(),
      platform: 'woocommerce',
      integration_id: integration.id,
      status: luneoStatus,
      customer_email: orderData.billing?.email || '',
      customer_name: `${orderData.billing?.first_name || ''} ${orderData.billing?.last_name || ''}`.trim(),
      total_amount: parseFloat(orderData.total || '0'),
      currency: orderData.currency || 'EUR',
      items: orderData.line_items?.map((item) => ({
        product_id: item.product_id?.toString(),
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(String(item.total || '0')),
      })) || [],
      metadata: {
        woocommerce_order: orderData,
        created_via: 'webhook',
      },
      updated_at: new Date().toISOString(),
    };

    let orderResult;
    if (existingOrder) {
      const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update(orderPayload)
        .eq('id', existingOrder.id)
        .select()
        .single();

      if (updateError) {
        logger.dbError('update WooCommerce order', updateError, {
          orderId: orderData.id,
          integrationId: integration.id,
        });
        throw updateError;
      }
      orderResult = updated;
    } else {
      const { data: created, error: insertError } = await supabase
        .from('orders')
        .insert({
          ...orderPayload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        logger.dbError('create WooCommerce order', insertError, {
          orderId: orderData.id,
          integrationId: integration.id,
        });
        throw insertError;
      }
      orderResult = created;
    }

    logger.info(`Commande ${orderData.id} synchronisée`, { 
      orderId: orderData.id,
      luneoOrderId: orderResult.id,
      status: orderResult.status,
    });

    return { 
      orderId: orderData.id.toString(), 
      luneoOrderId: orderResult.id,
      action: existingOrder ? 'updated' : 'created' 
    };
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.webhookError('woocommerce', 'order.created', errorObj, {
      orderId: orderData.id,
    });
    throw error;
  }
}

/**
 * Gérer la mise à jour d'une commande WooCommerce
 */
async function handleOrderUpdated(
  supabase: SupabaseClient,
  orderData: WooCommerceOrder,
  integration: WooCommerceIntegration
): Promise<WooCommerceWebhookResult> {
  try {
    logger.info(`Commande WooCommerce mise à jour: ${orderData.id}`, { orderId: orderData.id });

    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'processing': 'processing',
      'on-hold': 'on_hold',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'failed': 'failed',
    };

    const luneoStatus = statusMap[orderData.status] || 'pending';

    await supabase
      .from('orders')
      .update({
        status: luneoStatus,
        total_amount: parseFloat(orderData.total || '0'),
        metadata: {
          woocommerce_order: orderData,
          updated_via: 'webhook',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('external_id', orderData.id.toString())
      .eq('platform', 'woocommerce');
    
    return {
      success: true,
      orderId: orderData.id.toString(),
      message: 'Order updated successfully',
    };
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.webhookError('woocommerce', 'order.updated', errorObj);
    throw error;
  }
}

/**
 * Gérer le paiement d'une commande WooCommerce
 */
async function handleOrderPaid(
  supabase: SupabaseClient,
  orderData: WooCommerceOrder,
  integration: WooCommerceIntegration
): Promise<WooCommerceWebhookResult> {
  try {
    logger.info(`Commande WooCommerce payée: ${orderData.id}`, { orderId: orderData.id });

    // Mettre à jour le statut
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        metadata: {
          woocommerce_order: orderData,
          paid_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('external_id', orderData.id.toString())
      .eq('platform', 'woocommerce');

    // Générer les fichiers de production pour les designs personnalisés
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('external_id', orderData.id.toString())
      .single();

    if (order) {
      // Récupérer les designs associés
      const designIds = (order.items as Array<{ design_id?: string }>)
        ?.map((item) => item.design_id)
        .filter((id): id is string => Boolean(id)) || [];
      
      const { data: designs } = designIds.length > 0
        ? await supabase
            .from('designs')
            .select('*')
            .in('id', designIds)
        : { data: null };

      // Générer les fichiers de production pour chaque design
      if (designs && designs.length > 0) {
        for (const design of designs) {
          try {
            // Appeler l'API de génération de fichiers de production
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.luneo.app'}/api/orders/generate-production-files`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: order.id, designId: design.id }),
            });
          } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            logger.error(`Erreur génération fichiers pour design ${design.id}`, error);
          }
        }
      }
    }
    
    return {
      success: true,
      orderId: orderData.id.toString(),
      message: 'Order paid and production files generated',
    };
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.webhookError('woocommerce', 'order.paid', errorObj);
    throw error;
  }
}

/**
 * Gérer la complétion d'une commande WooCommerce
 */
async function handleOrderCompleted(
  supabase: SupabaseClient,
  orderData: WooCommerceOrder,
  integration: WooCommerceIntegration
): Promise<WooCommerceWebhookResult> {
  try {
    logger.info(`Commande WooCommerce complétée: ${orderData.id}`, { orderId: orderData.id });

    await supabase
      .from('orders')
      .update({
        status: 'completed',
        metadata: {
          woocommerce_order: orderData,
          completed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('external_id', orderData.id.toString())
      .eq('platform', 'woocommerce');
    
    return {
      success: true,
      orderId: orderData.id.toString(),
      message: 'Order completed successfully',
    };
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.webhookError('woocommerce', 'order.completed', errorObj);
    throw error;
  }
}

/**
 * Gérer l'annulation d'une commande WooCommerce
 */
async function handleOrderCancelled(
  supabase: SupabaseClient,
  orderData: WooCommerceOrder,
  integration: WooCommerceIntegration
): Promise<WooCommerceWebhookResult> {
  try {
    logger.info(`Commande WooCommerce annulée: ${orderData.id}`, { orderId: orderData.id });

    await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        metadata: {
          woocommerce_order: orderData,
          cancelled_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('external_id', orderData.id.toString())
      .eq('platform', 'woocommerce');
    
    return {
      success: true,
      orderId: orderData.id.toString(),
      message: 'Order cancelled successfully',
    };
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.webhookError('woocommerce', 'order.cancelled', errorObj);
    throw error;
  }
}

/**
 * Gérer la mise à jour d'un produit WooCommerce
 */
async function handleProductUpdated(
  supabase: SupabaseClient,
  productData: WooCommerceProduct,
  integration: WooCommerceIntegration
): Promise<WooCommerceWebhookResult> {
  try {
    logger.info(`Produit WooCommerce mis à jour: ${productData.id}`, { productId: productData.id });

    // Synchroniser le produit avec Luneo
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('external_id', productData.id.toString())
      .eq('platform', 'woocommerce')
      .single();

    const productPayload = {
      external_id: productData.id.toString(),
      platform: 'woocommerce',
      integration_id: integration.id,
      name: productData.name,
      description: productData.description || '',
      price: parseFloat(productData.price || '0'),
      currency: 'EUR',
      images: productData.images?.map((img) => img.src) || [],
      metadata: {
        woocommerce_product: productData,
        updated_via: 'webhook',
      },
      updated_at: new Date().toISOString(),
    };

    if (existingProduct) {
      await supabase
        .from('products')
        .update(productPayload)
        .eq('id', existingProduct.id);
    } else {
      productPayload.created_at = new Date().toISOString();
      await supabase
        .from('products')
        .insert(productPayload);
    }
    
    return {
      success: true,
      productId: productData.id.toString(),
      message: 'Product updated successfully',
    };
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.webhookError('woocommerce', 'product.updated', errorObj);
    throw error;
  }
}

/**
 * Gérer la suppression d'un produit WooCommerce
 */
async function handleProductDeleted(
  supabase: SupabaseClient,
  productData: WooCommerceProduct,
  integration: WooCommerceIntegration
): Promise<WooCommerceWebhookResult> {
  try {
    logger.info(`Produit WooCommerce supprimé: ${productData.id}`, { productId: productData.id });

    // Marquer le produit comme supprimé dans Luneo
    await supabase
      .from('products')
      .update({
        status: 'deleted',
        metadata: {
          woocommerce_product: productData,
          deleted_via: 'webhook',
          deleted_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('external_id', productData.id.toString())
      .eq('platform', 'woocommerce');
    
    return {
      success: true,
      productId: productData.id.toString(),
      message: 'Product deleted successfully',
    };
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.webhookError('woocommerce', 'product.deleted', errorObj);
    throw error;
  }
}

/**
 * Gérer le remboursement d'une commande WooCommerce
 */
async function handleOrderRefunded(
  supabase: SupabaseClient,
  orderData: WooCommerceOrder,
  integration: WooCommerceIntegration
): Promise<WooCommerceWebhookResult> {
  try {
    logger.info(`Commande WooCommerce remboursée: ${orderData.id}`, { orderId: orderData.id });

    await supabase
      .from('orders')
      .update({
        status: 'refunded',
        metadata: {
          woocommerce_order: orderData,
          refunded_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('external_id', orderData.id.toString())
      .eq('platform', 'woocommerce');
    
    return {
      success: true,
      orderId: orderData.id.toString(),
      message: 'Order refunded successfully',
    };
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.webhookError('woocommerce', 'order.refunded', errorObj);
    throw error;
  }
}

/**
 * Gérer la mise à jour du stock WooCommerce
 */
async function handleStockUpdated(
  supabase: SupabaseClient,
  productData: WooCommerceProduct,
  integration: WooCommerceIntegration
): Promise<WooCommerceWebhookResult> {
  try {
    logger.info(`Stock WooCommerce mis à jour: ${productData.id}`, { productId: productData.id });

    // Mettre à jour le stock du produit dans Luneo
    await supabase
      .from('products')
      .update({
        metadata: {
          woocommerce_product: productData,
          stock_quantity: productData.stock_quantity,
          stock_status: productData.stock_status,
          updated_via: 'webhook',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('external_id', productData.id.toString())
      .eq('platform', 'woocommerce');
    
    return {
      success: true,
      productId: productData.id.toString(),
      message: 'Stock updated successfully',
    };
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.webhookError('woocommerce', 'stock.updated', errorObj);
    throw error;
  }
}
