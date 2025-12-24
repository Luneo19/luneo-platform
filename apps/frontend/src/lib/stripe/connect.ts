/**
 * Stripe Connect Integration
 * MK-008: Stripe Connect pour paiements créateurs
 */

import Stripe from 'stripe';
import { logger } from '@/lib/logger';

/**
 * Get Stripe instance with proper error handling
 * Professional implementation with validation
 */
function getStripeInstance(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    logger.error('Stripe secret key not configured', new Error('STRIPE_SECRET_KEY missing'));
    throw new Error(
      'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable. ' +
      'This feature requires Stripe Connect to be properly configured.'
    );
  }

  if (!secretKey.startsWith('sk_')) {
    logger.warn('Stripe secret key format may be invalid', { keyPrefix: secretKey.substring(0, 5) });
  }

  try {
    return new Stripe(secretKey, {
      apiVersion: '2025-10-29.clover' as any,
      maxNetworkRetries: 3,
      timeout: 30000,
      typescript: true,
    });
  } catch (error) {
    logger.error('Failed to initialize Stripe client', error as Error);
    throw new Error('Failed to initialize Stripe client. Please check your configuration.');
  }
}

// Lazy initialization - only create Stripe instance when needed
// This prevents build-time errors when STRIPE_SECRET_KEY is not set
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = getStripeInstance();
  }
  return stripeInstance;
}

// Export getter function instead of direct instance
const stripe = {
  get accounts() {
    return getStripe().accounts;
  },
  get accountLinks() {
    return getStripe().accountLinks;
  },
  get paymentIntents() {
    return getStripe().paymentIntents;
  },
  get transfers() {
    return getStripe().transfers;
  },
  get balance() {
    return getStripe().balance;
  },
  get payouts() {
    return getStripe().payouts;
  },
  get applicationFees() {
    return getStripe().applicationFees;
  },
} as Stripe;

export interface ConnectAccountData {
  email: string;
  country: string;
  businessType: 'individual' | 'company';
  businessName?: string;
  firstName?: string;
  lastName?: string;
}

export interface ConnectAccountStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    pendingVerification: string[];
  };
}

export interface PayoutData {
  amount: number;
  currency: string;
  destination: string;
  description?: string;
}

/**
 * Create a new Stripe Connect account for a creator
 * Professional implementation with comprehensive error handling
 */
export async function createConnectAccount(data: ConnectAccountData): Promise<Stripe.Account> {
  try {
    // Validate input data
    if (!data.email || !data.country) {
      throw new Error('Email and country are required to create a Connect account');
    }

    const accountParams: Stripe.AccountCreateParams = {
      type: 'express',
      country: data.country,
      email: data.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: data.businessType,
      metadata: {
        platform: 'luneo',
        created_via: 'marketplace',
        created_at: new Date().toISOString(),
      },
    };

    // Add individual or company information based on business type
    if (data.businessType === 'individual') {
      if (!data.firstName || !data.lastName) {
        throw new Error('First name and last name are required for individual accounts');
      }
      accountParams.individual = {
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
      };
    } else {
      if (!data.businessName) {
        throw new Error('Business name is required for company accounts');
      }
      accountParams.company = {
        name: data.businessName,
      };
    }

    // Create account with error handling
    const account = await stripe.accounts.create(accountParams);
    
    logger.info('Stripe Connect account created successfully', {
      accountId: account.id,
      country: account.country,
      type: account.type,
    });

    return account;
  } catch (error: any) {
    // Enhanced error logging and handling
    if (error?.type === 'StripeAuthenticationError') {
      logger.error('Stripe authentication failed', error, {
        message: 'Invalid Stripe API key or configuration issue',
      });
      throw new Error(
        'Stripe authentication failed. Please verify your STRIPE_SECRET_KEY is correct and has the necessary permissions.'
      );
    }
    
    if (error?.type === 'StripeAPIError') {
      logger.error('Stripe API error', error, {
        code: error.code,
        param: error.param,
      });
      throw new Error(`Stripe API error: ${error.message || 'Unknown error'}`);
    }

    logger.error('Failed to create Stripe Connect account', error, {
      email: data.email,
      country: data.country,
      businessType: data.businessType,
    });

    throw error;
  }
}

/**
 * Create an account link for onboarding
 * Professional implementation with validation
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink> {
  try {
    if (!accountId) {
      throw new Error('Account ID is required to create an account link');
    }

    if (!refreshUrl || !returnUrl) {
      throw new Error('Refresh URL and return URL are required');
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    logger.info('Stripe account link created', {
      accountId,
      url: accountLink.url,
    });

    return accountLink;
  } catch (error: any) {
    logger.error('Failed to create Stripe account link', error, {
      accountId,
      refreshUrl,
      returnUrl,
    });
    throw error;
  }
}

/**
 * Create a login link for the Express dashboard
 * Professional implementation with validation
 */
export async function createLoginLink(accountId: string): Promise<Stripe.LoginLink> {
  try {
    if (!accountId) {
      throw new Error('Account ID is required to create a login link');
    }

    const loginLink = await stripe.accounts.createLoginLink(accountId);
    
    logger.info('Stripe login link created', {
      accountId,
    });

    return loginLink;
  } catch (error: any) {
    logger.error('Failed to create Stripe login link', error, {
      accountId,
    });
    throw error;
  }
}

/**
 * Get Connect account status
 * Professional implementation with comprehensive error handling
 */
export async function getAccountStatus(accountId: string): Promise<ConnectAccountStatus> {
  try {
    if (!accountId) {
      throw new Error('Account ID is required to retrieve account status');
    }

    const account = await stripe.accounts.retrieve(accountId);

    const status: ConnectAccountStatus = {
      accountId: account.id,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      requirements: {
        currentlyDue: account.requirements?.currently_due || [],
        eventuallyDue: account.requirements?.eventually_due || [],
        pastDue: account.requirements?.past_due || [],
        pendingVerification: account.requirements?.pending_verification || [],
      },
    };

    logger.info('Stripe account status retrieved', {
      accountId,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
    });

    return status;
  } catch (error: any) {
    if (error?.type === 'StripeInvalidRequestError' && error?.code === 'resource_missing') {
      logger.error('Stripe account not found', error, { accountId });
      throw new Error(`Stripe Connect account not found: ${accountId}`);
    }

    logger.error('Failed to retrieve Stripe account status', error, {
      accountId,
    });
    throw error;
  }
}

/**
 * Create a payment intent with application fee (platform commission)
 */
export async function createMarketplacePayment(
  amount: number,
  currency: string,
  connectedAccountId: string,
  applicationFeePercent: number = 30, // 30% platform commission
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  const applicationFeeAmount = Math.round(amount * (applicationFeePercent / 100));

  return stripe.paymentIntents.create({
    amount,
    currency,
    application_fee_amount: applicationFeeAmount,
    transfer_data: {
      destination: connectedAccountId,
    },
    metadata: {
      platform: 'luneo',
      type: 'marketplace_purchase',
      ...metadata,
    },
  });
}

/**
 * Create a transfer to a connected account
 */
export async function createTransfer(
  amount: number,
  currency: string,
  destinationAccountId: string,
  description?: string
): Promise<Stripe.Transfer> {
  return stripe.transfers.create({
    amount,
    currency,
    destination: destinationAccountId,
    description,
  });
}

/**
 * Get account balance
 */
export async function getAccountBalance(accountId: string): Promise<Stripe.Balance> {
  return stripe.balance.retrieve({
    stripeAccount: accountId,
  });
}

/**
 * List payouts for a connected account
 */
export async function listPayouts(
  accountId: string,
  limit: number = 10
): Promise<Stripe.ApiList<Stripe.Payout>> {
  return stripe.payouts.list(
    { limit },
    { stripeAccount: accountId }
  );
}

/**
 * Create a payout to a connected account's bank
 */
export async function createPayout(
  accountId: string,
  amount: number,
  currency: string
): Promise<Stripe.Payout> {
  return stripe.payouts.create(
    {
      amount,
      currency,
    },
    { stripeAccount: accountId }
  );
}

/**
 * Get platform earnings
 */
export async function getPlatformEarnings(
  startDate?: Date,
  endDate?: Date
): Promise<{ total: number; count: number }> {
  const params: Stripe.ApplicationFeeListParams = {
    limit: 100,
  };

  if (startDate && endDate) {
    params.created = { 
      gte: Math.floor(startDate.getTime() / 1000),
      lte: Math.floor(endDate.getTime() / 1000)
    };
  } else if (startDate) {
    params.created = { gte: Math.floor(startDate.getTime() / 1000) };
  } else if (endDate) {
    params.created = { lte: Math.floor(endDate.getTime() / 1000) };
  }

  const fees = await stripe.applicationFees.list(params);

  const total = fees.data.reduce((sum, fee) => sum + fee.amount, 0);

  return {
    total,
    count: fees.data.length,
  };
}

/**
 * Delete a Connect account (for cleanup)
 */
export async function deleteConnectAccount(accountId: string): Promise<Stripe.DeletedAccount> {
  return stripe.accounts.del(accountId);
}

// Export stripe instance getter
export { stripe, getStripe };

