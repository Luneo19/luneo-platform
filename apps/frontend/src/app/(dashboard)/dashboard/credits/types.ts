/**
 * Types for Credits Management
 */

export type CreditsTab = 'overview' | 'history' | 'packs' | 'settings';

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  popular?: boolean;
  bonus?: number;
  description?: string;
  features?: string[];
}

export interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'subscription';
  amount: number;
  description: string;
  createdAt: Date | number | string;
  status: 'completed' | 'pending' | 'failed';
  metadata?: {
    packId?: string;
    orderId?: string;
    aiModel?: string;
    [key: string]: unknown;
  };
}

export interface CreditStats {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  purchasedCredits: number;
  bonusCredits: number;
  lastPurchaseDate?: Date | string;
  nextExpirationDate?: Date | string;
  monthlyUsage: number;
  averageUsagePerDay: number;
}
