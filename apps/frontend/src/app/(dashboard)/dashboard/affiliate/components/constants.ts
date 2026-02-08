import {
  CheckCircle,
  Clock,
  Trophy,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

export const COMMISSION_RATE = 20; // 20% commission
export const MIN_PAYOUT_THRESHOLD = 50; // €50 minimum

export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: LucideIcon }
> = {
  pending: { label: 'En attente', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
  active: { label: 'Actif', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  converted: { label: 'Converti', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Trophy },
  expired: { label: 'Expiré', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle },
  paid: { label: 'Payé', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: XCircle },
};
