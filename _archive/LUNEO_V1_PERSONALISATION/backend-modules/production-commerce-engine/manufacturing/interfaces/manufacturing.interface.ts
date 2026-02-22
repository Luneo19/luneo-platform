/**
 * Shared types for Manufacturing/POD sub-module.
 */

export interface PODQuoteItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  currency: string;
  estimatedDays?: number;
}

export interface PODQuote {
  providerId: string;
  providerName: string;
  items: PODQuoteItem[];
  shippingCost: number;
  totalCost: number;
  currency: string;
  estimatedDays?: number;
  validUntil?: Date;
}

export interface PODShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface PODOrderItem {
  productId: string;
  variantId?: string;
  quantity: number;
  files?: Record<string, string>;
  options?: Record<string, unknown>;
}

export interface PODCreateOrderResult {
  externalOrderId: string;
  status: string;
  estimatedCompletion?: Date;
  raw?: Record<string, unknown>;
}

export interface PODOrderStatusResult {
  externalOrderId: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: Date;
  completedAt?: Date;
  error?: string;
  raw?: Record<string, unknown>;
}

export interface PODShippingRate {
  carrier: string;
  service: string;
  cost: number;
  currency: string;
  estimatedDays?: number;
}

export interface PODProduct {
  id: string;
  title: string;
  variants: Array<{ id: string; title: string; sku?: string; price: number; currency: string }>;
  category?: string;
}

export interface PODProviderRequirements {
  productTypes?: string[];
  region?: string;
  maxItems?: number;
  rush?: boolean;
}
