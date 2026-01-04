'use client';

/**
 * Header de la page Orders
 * Client Component minimal pour les interactions
 */

import { ShoppingCart } from 'lucide-react';
import type { OrderStats } from '../types';

interface OrdersHeaderProps {
  stats: OrderStats;
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(amount / 100);
}

export function OrdersHeader({ stats }: OrdersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-cyan-400" />
          Commandes
        </h1>
        <p className="text-gray-400 mt-1">
          {stats.total} commande{stats.total > 1 ? 's' : ''} •{' '}
          {formatPrice(stats.totalRevenue, 'EUR')} de revenus
        </p>
      </div>
    </div>
  );
}


