'use client';

import React, { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboard.store';
import { WidgetWrapper } from './WidgetWrapper';
import { Eye, ShoppingBag } from 'lucide-react';

const WIDGET_SLUG = 'top-products';

interface ProductItem {
  name: string;
  views?: number;
  salesCount?: number;
}

interface TopProductsData {
  products?: ProductItem[];
}

export function TopProductsWidget() {
  const { widgetData, fetchWidgetData } = useDashboardStore();
  const data = widgetData[WIDGET_SLUG] as TopProductsData | undefined;
  const isLoading = data === undefined && !Object.prototype.hasOwnProperty.call(widgetData, WIDGET_SLUG);

  useEffect(() => {
    fetchWidgetData(WIDGET_SLUG);
  }, [fetchWidgetData]);

  const products = data?.products ?? [];
  const hasData = products.length > 0;

  return (
    <WidgetWrapper
      title="Produits populaires"
      subtitle="Vues et ventes"
      isLoading={isLoading}
      error={data === null ? 'Impossible de charger les données' : undefined}
    >
      {hasData && (
        <ul className="space-y-3">
          {products.slice(0, 8).map((p, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 rounded-lg p-2 -mx-2 hover:bg-slate-700/30"
            >
              <span className="text-sm text-white truncate flex-1 min-w-0">
                {p.name}
              </span>
              <div className="flex items-center gap-3 shrink-0 text-slate-400 text-xs">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {p.views ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {p.salesCount ?? 0}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!hasData && !isLoading && data !== undefined && (
        <p className="text-slate-500 text-sm">Aucun produit pour le moment.</p>
      )}
    </WidgetWrapper>
  );
}
