export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    designs: number;
    renders: number;
    storage: number;
    apiCalls: number;
    teamMembers: number;
  };
  stripeProductId?: string;
  stripePriceId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingSubscription {
  id: string;
  brandId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingInvoice {
  id: string;
  brandId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate: Date;
  paidAt?: Date;
  stripeInvoiceId?: string;
  lineItems: BillingLineItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'subscription' | 'usage' | 'overage' | 'discount';
  metadata?: Record<string, unknown>;
}

export interface BillingUsage {
  id: string;
  brandId: string;
  metric: string;
  value: number;
  unit: string;
  period: Date;
  billed: boolean;
  createdAt: Date;
}

export interface BillingQuota {
  id: string;
  brandId: string;
  planId: string;
  metric: string;
  limit: number;
  used: number;
  period: Date;
  overage: number;
  overageRate: number;
  createdAt: Date;
  updatedAt: Date;
}