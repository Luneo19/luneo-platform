'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useDashboardStore } from '@/store/dashboard.store';
import { useI18n } from '@/i18n/useI18n';
import { WidgetWrapper } from './WidgetWrapper';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

const WIDGET_SLUG = 'recent-orders';

interface OrderItem {
  id: string;
  customer?: string;
  amount?: number;
  status?: string;
  formattedAmount?: string;
}

interface RecentOrdersData {
  orders?: OrderItem[];
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  paid: 'default',
  pending: 'secondary',
  processing: 'secondary',
  cancelled: 'destructive',
  refunded: 'destructive',
};

export function RecentOrdersWidget() {
  const { t } = useI18n();
  const { widgetData, fetchWidgetData } = useDashboardStore();
  const data = widgetData[WIDGET_SLUG] as RecentOrdersData | undefined;
  const isLoading = data === undefined && !Object.prototype.hasOwnProperty.call(widgetData, WIDGET_SLUG);

  useEffect(() => {
    fetchWidgetData(WIDGET_SLUG);
  }, [fetchWidgetData]);

  const orders = data?.orders ?? [];
  const hasData = orders.length > 0;

  return (
    <WidgetWrapper
      title={t('common.recentOrders')}
      subtitle={t('common.latestOrders')}
      isLoading={isLoading}
      error={data === null ? 'Impossible de charger les données' : undefined}
    >
      {hasData && (
        <ul className="space-y-2">
          {orders.slice(0, 8).map((order) => (
            <li key={order.id}>
              <Link
                href={`/dashboard/orders?id=${order.id}`}
                className="flex items-center justify-between gap-2 rounded-lg p-2 -mx-2 hover:bg-slate-700/30 transition-colors text-slate-300 hover:text-white"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-xs text-slate-500 block truncate">
                    #{order.id.slice(0, 8)}
                  </span>
                  <span className="text-sm truncate block">
                    {order.customer ?? 'Client'}
                  </span>
                </div>
                <span className="text-sm font-medium text-white shrink-0">
                  {order.formattedAmount ?? (typeof order.amount === 'number' ? `€${order.amount.toFixed(2)}` : '—')}
                </span>
                <Badge
                  variant={statusVariant[order.status ?? ''] ?? 'outline'}
                  className={cn(
                    'shrink-0 text-xs',
                    'bg-slate-700 text-slate-300 border-slate-600'
                  )}
                >
                  {order.status ?? '—'}
                </Badge>
                <ExternalLink className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!hasData && !isLoading && data !== undefined && (
        <p className="text-slate-500 text-sm">Aucune commande récente.</p>
      )}
    </WidgetWrapper>
  );
}
