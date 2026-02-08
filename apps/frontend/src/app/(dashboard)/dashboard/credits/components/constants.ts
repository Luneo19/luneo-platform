'use client';

import type { LucideIcon } from 'lucide-react';
import { Plus, Zap, RefreshCw, Gift, Clock } from 'lucide-react';
import type { CreditTransaction } from './types';

export interface TransactionTypeConfig {
  label: string;
  icon: LucideIcon;
  bg: string;
  color: string;
}

export const TRANSACTION_TYPE_CONFIG: Record<CreditTransaction['type'], TransactionTypeConfig> = {
  purchase: { label: 'Achat', icon: Plus, bg: 'bg-green-500/20', color: 'text-green-400' },
  usage: { label: 'Utilisation', icon: Zap, bg: 'bg-amber-500/20', color: 'text-amber-400' },
  refund: { label: 'Remboursement', icon: RefreshCw, bg: 'bg-blue-500/20', color: 'text-blue-400' },
  bonus: { label: 'Bonus', icon: Gift, bg: 'bg-purple-500/20', color: 'text-purple-400' },
  expiration: { label: 'Expiration', icon: Clock, bg: 'bg-gray-500/20', color: 'text-gray-600' },
};
