export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  price: number;
  stripePriceId?: string;
  isActive: boolean;
  isFeatured: boolean;
  savings?: number;
  badge?: string;
  description?: string;
  features?: string[];
}

export interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'expiration';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  source?: string;
  metadata?: Record<string, unknown>;
  packId?: string;
  packName?: string;
  createdAt: Date;
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
  trends: Array<{ date: string; credits: number }>;
}

export type CreditsTab = 'overview' | 'packs' | 'history' | 'stats' | 'settings';
