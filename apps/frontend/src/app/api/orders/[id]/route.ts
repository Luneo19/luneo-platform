import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';

type OrderRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/orders/[id]
 * Récupérer une commande spécifique avec tous ses détails
 */
export async function GET(request: NextRequest, { params }: OrderRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer la commande avec tous les détails
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (*),
        history:order_status_history (
          id,
          from_status,
          to_status,
          reason,
          notes,
          created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw { status: 404, message: 'Commande introuvable', code: 'ORDER_NOT_FOUND' };
      }
      logger.dbError('fetch order', error, { orderId: id, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération de la commande' };
    }

    return { order };
  }, '/api/orders/[id]', 'GET');
}

/**
 * PUT /api/orders/[id]
 * Mettre à jour une commande (principalement le statut)
 * Body: { status, tracking_number, notes }
 */
export async function PUT(request: NextRequest, { params }: OrderRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que la commande appartient à l'utilisateur
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, status, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingOrder) {
      logger.warn('Order update attempt on non-existent or unauthorized order', {
        orderId: id,
        userId: user.id,
      });
      throw { status: 404, message: 'Commande introuvable', code: 'ORDER_NOT_FOUND' };
    }

    const body = await request.json();
    const { status, tracking_number, shipping_method, notes } = body;

    // Préparer les mises à jour
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      // Valider le statut
      const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed'];
      if (!validStatuses.includes(status)) {
        throw {
          status: 400,
          message: 'Statut invalide',
          code: 'VALIDATION_ERROR',
        };
      }
      updates.status = status;

      // Mettre à jour les timestamps selon le statut
      if (status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
      }
      if (status === 'refunded') {
        updates.refunded_at = new Date().toISOString();
      }
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
    }

    if (tracking_number) {
      updates.tracking_number = tracking_number.trim();
      updates.shipped_at = updates.shipped_at || new Date().toISOString();
    }

    if (shipping_method) {
      updates.shipping_method = shipping_method;
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    // Effectuer la mise à jour
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update order', updateError, {
        orderId: id,
        userId: user.id,
        updates,
      });
      throw { status: 500, message: 'Erreur lors de la mise à jour' };
    }

    logger.info('Order updated', {
      orderId: id,
      userId: user.id,
      status: status || existingOrder.status,
    });

    return { order: updatedOrder };
  }, '/api/orders/[id]', 'PUT');
}

/**
 * DELETE /api/orders/[id]
 * Annuler une commande (soft delete via status)
 */
export async function DELETE(request: NextRequest, { params }: OrderRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que la commande existe et appartient à l'utilisateur
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, status, payment_status, stripe_payment_intent_id, total_amount')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingOrder) {
      logger.warn('Order cancellation attempt on non-existent or unauthorized order', {
        orderId: id,
        userId: user.id,
      });
      throw { status: 404, message: 'Commande introuvable', code: 'ORDER_NOT_FOUND' };
    }

    // Vérifier que la commande peut être annulée
    if (['completed', 'cancelled', 'refunded'].includes(existingOrder.status)) {
      throw {
        status: 400,
        message: 'Cette commande ne peut pas être annulée',
        code: 'ORDER_CANNOT_BE_CANCELLED',
      };
    }

    // Si la commande est payée, créer un remboursement Stripe
    let refund_initiated = false;
    try {
      const backendResult = await requestBackendCancellation(id, user.id);
      const backendPaymentStatus = backendResult.paymentStatus?.toString().toLowerCase();
      refund_initiated = backendPaymentStatus === 'refunded';
    } catch (backendError: any) {
      logger.error('Backend cancellation failed', backendError, {
        orderId: id,
        userId: user.id,
      });
      // Ne pas bloquer l'annulation si le backend échoue
    }

    // Annuler la commande (soft delete)
    const { error: cancelError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        payment_status: refund_initiated
          ? 'refunded'
          : existingOrder.payment_status === 'paid'
          ? 'pending_refund'
          : existingOrder.payment_status,
        cancelled_at: new Date().toISOString(),
        notes: `Annulée par l'utilisateur. Remboursement ${refund_initiated ? 'initié' : 'non nécessaire'}.`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (cancelError) {
      logger.dbError('cancel order', cancelError, {
        orderId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de l\'annulation' };
    }

    // Restaurer le stock des produits
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', id);

    if (itemsError) {
      logger.dbError('fetch order items for stock restoration', itemsError, { orderId: id });
    } else if (items && items.length > 0) {
      for (const item of items) {
        try {
          await supabase.rpc('increment_product_stock', {
            product_uuid: item.product_id,
            quantity: item.quantity,
          });
        } catch (stockError: any) {
          logger.error('Error restoring product stock', stockError, {
            productId: item.product_id,
            quantity: item.quantity,
          });
          // Ne pas bloquer l'annulation si le stock échoue
        }
      }
    }

    logger.info('Order cancelled', {
      orderId: id,
      userId: user.id,
      refundInitiated: refund_initiated,
    });

    return {
      message: 'Commande annulée avec succès',
      refund_initiated,
    };
  }, '/api/orders/[id]', 'DELETE');
}

/**
 * Fonction helper pour demander l'annulation au backend
 */
async function requestBackendCancellation(orderId: string, actorId: string) {
  const baseUrl =
    process.env.INTERNAL_API_URL ||
    process.env.LUNEO_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    '';
  const token =
    process.env.INTERNAL_API_TOKEN || process.env.LUNEO_INTERNAL_API_TOKEN || process.env.LUNEO_API_KEY || '';

  if (!baseUrl || !token) {
    throw new Error('Backend cancellation endpoint is not configured');
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}/internal/orders/${orderId}/cancel`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': token,
    },
    body: JSON.stringify({
      reason: 'user_cancelled',
      actorId,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Backend cancellation failed: ${response.status} ${message}`);
  }

  return response.json() as Promise<{ paymentStatus?: string }>;
}
