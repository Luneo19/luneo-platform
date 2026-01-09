/**
 * Constants pour AR Studio Integrations
 */

import { ShoppingCart, Globe, BarChart3, Megaphone, Package } from 'lucide-react';
import type { IntegrationCategory } from '../types';

export interface CategoryConfig {
  label: string;
  icon: React.ElementType;
  color: string;
}

export const CATEGORY_CONFIG: Record<IntegrationCategory, CategoryConfig> = {
  ecommerce: {
    label: 'E-commerce',
    icon: ShoppingCart,
    color: 'text-blue-400',
  },
  cms: {
    label: 'CMS',
    icon: Globe,
    color: 'text-green-400',
  },
  analytics: {
    label: 'Analytics',
    icon: BarChart3,
    color: 'text-purple-400',
  },
  marketing: {
    label: 'Marketing',
    icon: Megaphone,
    color: 'text-yellow-400',
  },
  other: {
    label: 'Autre',
    icon: Package,
    color: 'text-gray-400',
  },
};

export const POPULAR_INTEGRATIONS = [
  'shopify',
  'woocommerce',
  'wordpress',
  'google-analytics',
] as const;



