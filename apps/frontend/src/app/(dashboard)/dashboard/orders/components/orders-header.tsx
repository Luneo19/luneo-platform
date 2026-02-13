'use client';

/**
 * Header de la page Orders
 * Client Component minimal pour les interactions
 */

import { ShoppingCart, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/useI18n';
import type { OrderStats } from '../types';

interface OrdersHeaderProps {
  stats: OrderStats;
  onShowCreate?: () => void;
  onShowExport?: () => void;
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(amount / 100);
}

export function OrdersHeader({
  stats,
  onShowCreate,
  onShowExport,
}: OrdersHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-cyan-400" />
          {t('orders.title')}
        </h1>
        <p className="text-gray-400 mt-1">
          {t('orders.countOrders', { count: stats.total })} •{' '}
          {formatPrice(stats.totalRevenue, 'EUR')} {t('orders.revenue')}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {onShowExport && (
          <Button
            variant="outline"
            onClick={onShowExport}
            className="border-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('common.export')}
          </Button>
        )}
        {onShowCreate && (
          <Button
            onClick={onShowCreate}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('orders.newOrder')}
          </Button>
        )}
      </div>
    </div>
  );
}




