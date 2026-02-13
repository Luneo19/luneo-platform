/**
 * Empty state pour la page Products
 */

'use client';

import { EmptyState } from '@/components/ui/empty-states/EmptyState';
import { Package } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import type { ProductFilters } from '../types';

interface ProductsEmptyStateProps {
  filters: ProductFilters;
  onCreate: () => void;
  onResetFilters: () => void;
}

export function ProductsEmptyState({
  filters,
  onCreate,
  onResetFilters,
}: ProductsEmptyStateProps) {
  const { t } = useI18n();
  const hasFilters =
    filters.search ||
    Object.values(filters).some((v) => v !== null && v !== '' && v !== 'all');

  return (
    <EmptyState
      icon={<Package className="w-16 h-16" />}
      title={hasFilters ? t('products.noProductsFound') : t('products.noProducts')}
      description={
        hasFilters
          ? t('marketplace.noResultsHint')
          : t('products.noProductsDesc')
      }
      action={{
        label: hasFilters ? t('products.clearFilters') : t('products.create'),
        onClick: hasFilters ? onResetFilters : onCreate,
      }}
    />
  );
}



