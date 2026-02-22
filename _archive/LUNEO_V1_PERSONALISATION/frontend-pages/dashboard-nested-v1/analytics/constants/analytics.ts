/**
 * Constants pour la page Analytics
 */

import {
  DollarSign,
  ShoppingCart,
  Users,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { TimeRange, AnalyticsMetric } from '../types';

export const TIME_RANGES: Array<{ value: TimeRange; label: string; days: number }> = [
  { value: '24h', label: '24 heures', days: 1 },
  { value: '7d', label: '7 jours', days: 7 },
  { value: '30d', label: '30 jours', days: 30 },
  { value: '90d', label: '90 jours', days: 90 },
  { value: '1y', label: '1 an', days: 365 },
  { value: 'custom', label: 'Personnalisé', days: 0 },
];

export const METRIC_TYPES: Array<{
  value: string;
  label: string;
  icon: React.ElementType;
  color: string;
}> = [
  { value: 'revenue', label: 'Revenus', icon: DollarSign, color: 'green' },
  { value: 'orders', label: 'Commandes', icon: ShoppingCart, color: 'blue' },
  { value: 'users', label: 'Utilisateurs', icon: Users, color: 'purple' },
  { value: 'conversions', label: 'Conversions', icon: Target, color: 'green' },
  { value: 'avgOrderValue', label: 'Panier moyen', icon: TrendingUp, color: 'orange' },
  { value: 'conversionRate', label: 'Taux de conversion', icon: Zap, color: 'pink' },
];

export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
] as const;



