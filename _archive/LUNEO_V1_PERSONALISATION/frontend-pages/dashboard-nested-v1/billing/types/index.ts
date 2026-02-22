/**
 * Types pour la page Billing
 */

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'business' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing';
export type SubscriptionPeriod = 'monthly' | 'yearly';

export interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  period: SubscriptionPeriod | null;
  stripe?: {
    customerId?: string | null;
    subscriptionId?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  };
}

export interface Plan {
  id: SubscriptionTier;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  popular?: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  date: string;
  periodStart?: string;
  periodEnd?: string;
  pdfUrl?: string;
}



