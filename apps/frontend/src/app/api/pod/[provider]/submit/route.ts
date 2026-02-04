/**
 * ★★★ API ROUTE - SOUMISSION POD ★★★
 * API route pour soumettre une commande à un fournisseur POD
 * - Printful
 * - Printify
 * - Gelato
 */

import { ApiResponseBuilder } from '@/lib/api-response';
import { assertOwnership } from '@/lib/auth/assert-ownership';
import { requireAuthApi } from '@/lib/auth/require-auth-api';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// ========================================
// SCHEMA
// ========================================

const PODSubmitSchema = z.object({
  orderId: z.string().cuid(),
  autoFulfill: z.boolean().optional().default(false),
  notifyCustomer: z.boolean().optional().default(true),
});

// ========================================
// POST - Soumet la commande au POD
// ========================================

// ✅ Force dynamic rendering (pas de cache)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  return ApiResponseBuilder.handle(
    async () => {
      const { provider } = params;
      const body = await request.json().catch(() => {
        throw { status: 400, message: 'Body JSON invalide', code: 'INVALID_JSON' };
      });

      // Validation
      const parseResult = PODSubmitSchema.safeParse(body);
      if (!parseResult.success) {
        throw {
          status: 400,
          message: 'Données invalides',
          code: 'VALIDATION_ERROR',
          details: parseResult.error.errors,
        };
      }
      const validated = parseResult.data;

      // Vérifier que le provider est supporté
      const supportedProviders = ['printful', 'printify', 'gelato'];
      if (!supportedProviders.includes(provider.toLowerCase())) {
        return ApiResponseBuilder.badRequest(
          `Provider non supporté: ${provider}. Providers supportés: ${supportedProviders.join(', ')}`
        );
      }

      logger.info('Submitting order to POD', {
        orderId: validated.orderId,
        provider,
        autoFulfill: validated.autoFulfill,
      });

      const user = await requireAuthApi(request);

      const order = await db.order.findUnique({
        where: { id: validated.orderId },
      });

      if (!order) {
        return ApiResponseBuilder.notFound('Order not found');
      }

      // Verify user owns this order
      await assertOwnership(order.userId);

      // Extract items from metadata (items are stored in metadata as per schema)
      const metadata = order.metadata as any;
      const items = metadata?.items || [];

      if (!items || items.length === 0) {
        return ApiResponseBuilder.badRequest('Order has no items');
      }

      // Get product details for POD mapping
      const product = await db.product.findUnique({
        where: { id: order.productId },
      });

      if (!product) {
        return ApiResponseBuilder.badRequest('Product not found for order');
      }

      // Get POD mapping service
      const { podMappingService } =
        await import('@/lib/services/PODMappingService');

      // Get production files for order items with POD mappings
      const productionFiles = await Promise.all(
        items.map(async (item: any) => {
          // Get design/customization files
          let fileUrl = '';

          if (item.designId) {
            const design = await db.design.findUnique({
              where: { id: item.designId },
              select: { highResUrl: true, renderUrl: true },
            });
            fileUrl = design?.highResUrl || design?.renderUrl || '';
          } else if (order.designId) {
            const design = await db.design.findUnique({
              where: { id: order.designId },
              select: { highResUrl: true, renderUrl: true },
            });
            fileUrl = design?.highResUrl || design?.renderUrl || '';
          }

          // Get POD variant/product mappings from service
          const variantId = await podMappingService.getVariantId(
            order.productId,
            provider.toLowerCase() as any,
            item.variantId
          );

          let productId: number | string | undefined;
          let productUid: string | undefined;

          if (provider.toLowerCase() === 'printify') {
            productId = await podMappingService.getProductId(
              order.productId,
              'printify',
              item.productId
            );
          } else if (provider.toLowerCase() === 'gelato') {
            productUid = await podMappingService.getProductUid(
              order.productId,
              'gelato',
              item.productId
            );
          }

          return {
            itemId: item.id || order.id,
            fileUrl,
            quantity: item.quantity || 1,
            variantId,
            productId,
            productUid,
            productName: product.name,
          };
        })
      );

      // Submit to POD provider
      let podOrderId: string;
      let trackingUrl: string | undefined;

      switch (provider.toLowerCase()) {
        case 'printful':
          podOrderId = await submitToPrintful(
            order,
            productionFiles,
            validated.autoFulfill
          );
          trackingUrl = validated.autoFulfill
            ? `https://www.printful.com/track/${podOrderId}`
            : undefined;
          break;

        case 'printify':
          podOrderId = await submitToPrintify(
            order,
            productionFiles,
            validated.autoFulfill
          );
          trackingUrl = validated.autoFulfill
            ? `https://printify.com/track/${podOrderId}`
            : undefined;
          break;

        case 'gelato':
          podOrderId = await submitToGelato(
            order,
            productionFiles,
            validated.autoFulfill
          );
          trackingUrl = validated.autoFulfill
            ? `https://gelato.com/track/${podOrderId}`
            : undefined;
          break;

        default:
          return ApiResponseBuilder.badRequest(
            `Unsupported provider: ${provider}`
          );
      }

      // Update order with POD info
      await db.order.update({
        where: { id: validated.orderId },
        data: {
          metadata: {
            ...((order.metadata as any) || {}),
            podProvider: provider,
            podOrderId,
            podSubmittedAt: new Date().toISOString(),
            trackingUrl,
          } as any,
        },
      });

      // Send notification if requested
      if (validated.notifyCustomer && order.userId) {
        const { notificationService } =
          await import('@/lib/services/NotificationService');
        await notificationService.createNotification({
          userId: order.userId,
          type: 'order',
          title: 'Commande soumise à la production',
          message: `Votre commande ${order.orderNumber} a été soumise à ${provider}.`,
          actionUrl: `/dashboard/orders/${order.id}`,
        });
      }

      const result = {
        podOrderId,
        status: 'submitted',
        trackingUrl,
        provider,
        submittedAt: new Date().toISOString(),
      };

      logger.info('Order submitted to POD', {
        orderId: validated.orderId,
        podOrderId,
        provider,
      });

      return ApiResponseBuilder.success(result);
    },
    `/api/pod/${params.provider}/submit`,
    'POST'
  );
}

// ========================================
// POD PROVIDER FUNCTIONS
// ========================================

/**
 * Soumet une commande à Printful
 */
async function submitToPrintful(
  order: any,
  productionFiles: Array<{
    itemId: string;
    fileUrl: string;
    quantity: number;
    variantId?: string | number;
    productId?: string | number;
    productUid?: string;
    productName?: string;
  }>,
  autoFulfill: boolean
): Promise<string> {
  try {
    const printfulApiKey = process.env.PRINTFUL_API_KEY;
    if (!printfulApiKey) {
      throw new Error('Printful API key not configured');
    }

    // Build Printful order payload
    const printfulOrder = {
      recipient: {
        name: order.customerName || '',
        address1: order.shippingAddress?.street || '',
        city: order.shippingAddress?.city || '',
        state_code: order.shippingAddress?.state || '',
        country_code: order.shippingAddress?.country || '',
        zip: order.shippingAddress?.postalCode || '',
        phone: order.customerPhone || '',
        email: order.customerEmail || '',
      },
      items: productionFiles.map(file => {
        // Use mapped variant_id or fallback to default
        const variantId = file.variantId
          ? typeof file.variantId === 'string'
            ? parseInt(file.variantId, 10)
            : file.variantId
          : 1; // Default variant if not mapped

        return {
          variant_id: variantId,
          quantity: file.quantity,
          files: [
            {
              url: file.fileUrl,
            },
          ],
          name: file.productName || 'Custom Product',
        };
      }),
      confirm: autoFulfill,
      external_id: order.orderNumber, // Link to Luneo order
    };

    const response = await fetch('https://api.printful.com/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${printfulApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(printfulOrder),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Printful API error: ${error}`);
    }

    const data = await response.json();
    return data.result.id.toString();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error submitting to Printful', {
      error: errorMessage,
      orderId: order.id,
    });
    // Re-throw the error - caller must handle it properly
    throw new Error(`Printful submission failed: ${errorMessage}`);
  }
}

/**
 * Soumet une commande à Printify
 */
async function submitToPrintify(
  order: any,
  productionFiles: Array<{
    itemId: string;
    fileUrl: string;
    quantity: number;
    variantId?: string | number;
    productId?: string | number;
    productUid?: string;
    productName?: string;
  }>,
  autoFulfill: boolean
): Promise<string> {
  try {
    const printifyApiKey = process.env.PRINTIFY_API_KEY;
    const printifyShopId = process.env.PRINTIFY_SHOP_ID;

    if (!printifyApiKey || !printifyShopId) {
      throw new Error('Printify API credentials not configured');
    }

    // Build Printify order payload
    const printifyOrder = {
      line_items: productionFiles.map(file => {
        // Use mapped product_id and variant_id or fallback to defaults
        const productId = file.productId
          ? typeof file.productId === 'string'
            ? parseInt(file.productId, 10)
            : file.productId
          : 1;
        const variantId = file.variantId
          ? typeof file.variantId === 'string'
            ? parseInt(file.variantId, 10)
            : file.variantId
          : 1;

        return {
          product_id: productId,
          variant_id: variantId,
          quantity: file.quantity,
          print_files: {
            front: file.fileUrl,
          },
        };
      }),
      shipping_method: 1,
      send_shipping_notification: autoFulfill,
      external_id: order.orderNumber, // Link to Luneo order
    };

    const response = await fetch(
      `https://api.printify.com/v1/shops/${printifyShopId}/orders.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${printifyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printifyOrder),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Printify API error: ${error}`);
    }

    const data = await response.json();
    return data.id.toString();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error submitting to Printify', {
      error: errorMessage,
      orderId: order.id,
    });
    // Re-throw the error - caller must handle it properly
    throw new Error(`Printify submission failed: ${errorMessage}`);
  }
}

/**
 * Soumet une commande à Gelato
 */
async function submitToGelato(
  order: any,
  productionFiles: Array<{
    itemId: string;
    fileUrl: string;
    quantity: number;
    variantId?: string | number;
    productId?: string | number;
    productUid?: string;
    productName?: string;
  }>,
  autoFulfill: boolean
): Promise<string> {
  try {
    const gelatoApiKey = process.env.GELATO_API_KEY;
    if (!gelatoApiKey) {
      throw new Error('Gelato API key not configured');
    }

    // Build Gelato order payload
    const gelatoOrder = {
      items: productionFiles.map(file => {
        // Use mapped productUid from service or fallback
        const productUid =
          file.productUid ||
          file.productId?.toString() ||
          `product_${order.productId}`;

        return {
          productUid,
          quantity: file.quantity,
          files: [
            {
              url: file.fileUrl,
              sides: ['front'],
            },
          ],
        };
      }),
      shippingAddress: {
        name: order.customerName || '',
        address1: order.shippingAddress?.street || '',
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
        country: order.shippingAddress?.country || '',
        zip: order.shippingAddress?.postalCode || '',
        phone: order.customerPhone || '',
        email: order.customerEmail || '',
      },
      autoFulfill,
      externalId: order.orderNumber, // Link to Luneo order
    };

    const response = await fetch('https://api.gelato.com/v4/orders', {
      method: 'POST',
      headers: {
        'X-API-KEY': gelatoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gelatoOrder),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gelato API error: ${error}`);
    }

    const data = await response.json();
    return data.orderId || data.id?.toString() || `gelato_${Date.now()}`;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error submitting to Gelato', {
      error: errorMessage,
      orderId: order.id,
    });
    // Re-throw the error - caller must handle it properly
    throw new Error(`Gelato submission failed: ${errorMessage}`);
  }
}
