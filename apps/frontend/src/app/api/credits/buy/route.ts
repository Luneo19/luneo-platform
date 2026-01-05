import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';
import { z } from 'zod';

const buyCreditsSchema = z.object({
  packSize: z.enum(['100', '500', '1000']).transform(Number),
});

/**
 * POST /api/credits/buy
 * Crée une session Stripe Checkout pour acheter des crédits IA
 */
export async function POST(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    
    // Validation
    const validation = buyCreditsSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Pack invalide. Packs disponibles: 100, 500, 1000',
        code: 'INVALID_PACK',
        details: validation.error.issues,
      };
    }

    const { packSize } = validation.data;

    // Vérifier Stripe config
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('STRIPE_SECRET_KEY not configured', new Error('Missing Stripe configuration'));
      throw {
        status: 500,
        message: 'Configuration Stripe manquante',
        code: 'CONFIGURATION_ERROR',
      };
    }

    // Récupérer le Price ID depuis la DB ou env vars
    let priceId: string | undefined;
    
    // Option 1: Depuis la DB via backend API
    try {
      // Use NEXT_PUBLIC_API_URL from environment variables
      // Fallback to localhost for development only
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 
        (process.env.NODE_ENV === 'production' 
          ? null // Should be configured in Vercel
          : 'http://localhost:3001');
      const packsResponse = await fetch(`${backendUrl}/credits/packs`, {
        headers: {
          'Authorization': `Bearer ${user.id}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (packsResponse.ok) {
        const packsData = await packsResponse.json();
        const pack = Array.isArray(packsData) 
          ? packsData.find((p: any) => p.credits === packSize)
          : packsData.packs?.find((p: any) => p.credits === packSize);
        
        if (pack) {
          priceId = pack.stripePriceId || pack.stripe_price_id;
        }
      }
    } catch (fetchError) {
      logger.warn('Failed to fetch pack from backend, using env vars', { error: fetchError });
    }
    
    // Option 2: Depuis env vars (fallback)
    if (!priceId) {
      const packPrices: Record<number, string> = {
        100: process.env.STRIPE_PRICE_CREDITS_100 || 'price_1SgiPqKG9MsM6fdS8zMD8VuY',
        500: process.env.STRIPE_PRICE_CREDITS_500 || 'price_1SgiPrKG9MsM6fdSwAJaHCLj',
        1000: process.env.STRIPE_PRICE_CREDITS_1000 || 'price_1SgiPsKG9MsM6fdS5lPGuAdd',
      };
      priceId = packPrices[packSize];
    }
    
    if (!priceId) {
      logger.error('Price ID missing for pack', new Error('Price ID not configured'), {
        packSize,
      });
      throw {
        status: 400,
        message: `Pack ${packSize} non configuré`,
        code: 'PACK_NOT_CONFIGURED',
      };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';

    // Créer session Stripe Checkout
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment', // One-time payment (pas subscription)
        success_url: `${baseUrl}/dashboard?credits_purchase=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/dashboard?credits_purchase=cancel`,
        client_reference_id: user.id,
        customer_email: user.email,
        metadata: {
          userId: user.id,
          packSize: packSize.toString(),
          credits: packSize.toString(),
          type: 'credits_purchase',
        },
        // Expiration après 30 minutes
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      });

      logger.info('Credit purchase session created', {
        userId: user.id,
        packSize,
        sessionId: session.id,
        priceId,
      });

      return {
        url: session.url,
        sessionId: session.id,
        packSize,
        credits: packSize,
      };
    } catch (stripeError: any) {
      logger.error('Error creating Stripe checkout session', stripeError, {
        userId: user.id,
        packSize,
      });
      throw {
        status: 500,
        message: `Erreur lors de la création de la session de paiement: ${stripeError.message}`,
        code: 'STRIPE_ERROR',
        details: stripeError.type || 'unknown',
        stripeCode: stripeError.code || null,
      };
    }
  }, '/api/credits/buy', 'POST');
}
















