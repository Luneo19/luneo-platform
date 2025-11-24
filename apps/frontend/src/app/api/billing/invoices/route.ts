import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

// Initialiser Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

/**
 * GET /api/billing/invoices
 * Récupère les factures de l'utilisateur avec pagination
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPaginationParams(searchParams);

    // Récupérer le customer Stripe ID depuis le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.dbError('fetch profile for invoices', profileError, { userId: user.id });
    }

    if (!profile?.stripe_customer_id) {
      return {
        invoices: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    // Récupérer les factures depuis Stripe
    try {
      const invoices = await stripe.invoices.list({
        customer: profile.stripe_customer_id,
        limit: limit,
        starting_after: offset > 0 ? undefined : undefined, // Stripe utilise starting_after pour la pagination
      });

      const totalInvoices = invoices.data.length; // Stripe ne retourne pas toujours le total exact

      const formattedInvoices = invoices.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount_paid || invoice.amount_due,
        currency: invoice.currency,
        status: invoice.status,
        created: invoice.created,
        dueDate: invoice.due_date,
        paidAt: invoice.status_transitions.paid_at,
        invoicePdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        lineItems: invoice.lines.data.map((line) => ({
          description: line.description,
          amount: line.amount,
          quantity: line.quantity,
        })),
      }));

      const totalPages = Math.ceil(totalInvoices / limit);

      logger.info('Invoices fetched', {
        userId: user.id,
        count: formattedInvoices.length,
        customerId: profile.stripe_customer_id,
      });

      return {
        invoices: formattedInvoices,
        pagination: {
          page,
          limit,
          total: totalInvoices,
          totalPages,
          hasNext: invoices.has_more,
          hasPrev: page > 1,
        },
      };
    } catch (stripeError: any) {
      logger.error('Stripe invoices fetch error', stripeError, {
        userId: user.id,
        customerId: profile.stripe_customer_id,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la récupération des factures',
        code: 'STRIPE_ERROR',
      };
    }
  }, '/api/billing/invoices', 'GET');
}
