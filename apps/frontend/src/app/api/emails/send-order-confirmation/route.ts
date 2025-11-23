import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { sendOrderConfirmationEmailSchema } from '@/lib/validation/zod-schemas';

/**
 * POST /api/emails/send-order-confirmation
 * Envoie un email de confirmation de commande
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(sendOrderConfirmationEmailSchema, request, async (validatedData) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { orderId } = validatedData;

    // Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      if (orderError?.code === 'PGRST116') {
        throw { status: 404, message: 'Commande non trouvée', code: 'ORDER_NOT_FOUND' };
      }
      logger.dbError('fetch order for confirmation email', orderError, {
        orderId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération de la commande' };
    }

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.dbError('fetch profile for order confirmation email', profileError, {
        userId: user.id,
      });
    }

    // Envoyer l'email via le backend (ou service email)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    let emailResponse: Response;

    try {
      emailResponse = await fetch(`${backendUrl}/api/emails/send-order-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.INTERNAL_API_KEY || ''}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.order_number,
          customerEmail: profile?.email || user.email,
          customerName: profile?.name || user.email?.split('@')[0] || 'Client',
          orderTotal: order.total_amount,
          orderItems: order.items || [],
        }),
      });
    } catch (fetchError: any) {
      logger.error('Order confirmation email service fetch error', fetchError, {
        userId: user.id,
        orderId,
      });
      throw {
        status: 500,
        message: 'Erreur lors de l\'envoi de l\'email de confirmation',
        code: 'EMAIL_SERVICE_ERROR',
      };
    }

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      logger.error('Order confirmation email service error', new Error(errorText), {
        userId: user.id,
        orderId,
        status: emailResponse.status,
      });
      throw {
        status: emailResponse.status,
        message: 'Erreur lors de l\'envoi de l\'email de confirmation',
        code: 'EMAIL_SERVICE_ERROR',
      };
    }

    logger.info('Order confirmation email sent', {
      userId: user.id,
      orderId,
      orderNumber: order.order_number,
    });

    return ApiResponseBuilder.success({
      orderId,
    }, 'Email de confirmation de commande envoyé avec succès');
  });
}
