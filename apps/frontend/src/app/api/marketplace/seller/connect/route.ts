/**
 * API: Seller Connect Account
 * MK-008: Création et gestion des comptes Stripe Connect
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import {
  createConnectAccount,
  createAccountLink,
  getAccountStatus,
  createLoginLink,
} from '@/lib/stripe/connect';

/**
 * POST /api/marketplace/seller/connect
 * Create a new Stripe Connect account for a seller
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    const { country = 'FR', businessType = 'individual', businessName, firstName, lastName } = body;

    // Check if user already has a Connect account
    const { data: existingSeller } = await supabase
      .from('marketplace_sellers')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single();

    if (existingSeller?.stripe_account_id) {
      // Return existing account link
      const accountLink = await createAccountLink(
        existingSeller.stripe_account_id,
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/seller?refresh=true`,
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/seller?success=true`
      );

      return {
        accountId: existingSeller.stripe_account_id,
        onboardingUrl: accountLink.url,
        isExisting: true,
      };
    }

    // Create new Connect account
    const account = await createConnectAccount({
      email: user.email!,
      country,
      businessType,
      businessName,
      firstName,
      lastName,
    });

    // Save to database
    const { error: insertError } = await supabase
      .from('marketplace_sellers')
      .insert({
        user_id: user.id,
        stripe_account_id: account.id,
        status: 'pending',
        country,
        business_type: businessType,
        commission_rate: 30, // 30% platform fee
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      logger.dbError('create marketplace seller', insertError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la création du compte vendeur', code: 'DB_ERROR' };
    }

    // Create onboarding link
    const accountLink = await createAccountLink(
      account.id,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/seller?refresh=true`,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/seller?success=true`
    );

    logger.info('Stripe Connect account created', {
      userId: user.id,
      accountId: account.id,
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
      isExisting: false,
    };
  }, '/api/marketplace/seller/connect', 'POST');
}

/**
 * GET /api/marketplace/seller/connect
 * Get seller's Connect account status
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Get seller record
    const { data: seller } = await supabase
      .from('marketplace_sellers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!seller?.stripe_account_id) {
      return {
        hasAccount: false,
        status: null,
      };
    }

    // Get Stripe account status
    const status = await getAccountStatus(seller.stripe_account_id);

    // Update local status if needed
    const newStatus = status.chargesEnabled && status.payoutsEnabled ? 'active' : 'pending';
    if (seller.status !== newStatus) {
      await supabase
        .from('marketplace_sellers')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    }

    return {
      hasAccount: true,
      accountId: seller.stripe_account_id,
      status: newStatus,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      requirements: status.requirements,
      commissionRate: seller.commission_rate,
      createdAt: seller.created_at,
    };
  }, '/api/marketplace/seller/connect', 'GET');
}

