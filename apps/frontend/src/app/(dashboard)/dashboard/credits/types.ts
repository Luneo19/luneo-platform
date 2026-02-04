/**
 * Types for Credits Management
 */

export type CreditsTab = 'overview' | 'history' | 'packs' | 'settings';

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  price?: number;
  currency?: string;
  popular?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  isActive?: boolean;
  bonus?: number;
  savings?: number;
  badge?: string;
  description?: string;
  features?: string[];
}

export interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'adjustment' | 'subscription' | 'earned' | string;
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  source?: string;
  packId?: string;
  packName?: string;
  description?: string;
  date?: Date | number | string;
  createdAt: Date | number | string;
  status?: 'completed' | 'pending' | 'failed' | string;
  creditsBefore?: number;
  creditsAfter?: number;
  metadata?: {
    packId?: string;
    orderId?: string;
    aiModel?: string;
    endpoint?: string;
    model?: string;
    cost?: number;
    [key: string]: unknown;
  };
}

export interface CreditStats {
  currentBalance: number;
  totalPurchased: number;
  totalUsed: number;
  totalRefunded: number;
  totalBonus: number;
  usageRate: number;
  avgCostPerGeneration: number;
  totalGenerations: number;
  byType: Record<string, number>;
  byEndpoint: Record<string, number>;
  byModel: Record<string, number>;
  trends: Array<{ date: string; value: number }>;
}
