/**
 * Empty state pour la page Products
 */

'use client';

import { EmptyState } from '@/components/ui/empty-states/EmptyState';
import { Package } from 'lucide-react';
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
  const hasFilters =
    filters.search ||
    Object.values(filters).some((v) => v !== null && v !== '' && v !== 'all');

  return (
    <EmptyState
      icon={<Package className="w-16 h-16" />}
      title={hasFilters ? 'Aucun produit trouvé' : 'Aucun produit'}
      description={
        hasFilters
          ? 'Essayez de modifier vos filtres de recherche'
          : 'Créez votre premier produit pour commencer'
      }
      action={{
        label: hasFilters ? 'Effacer les filtres' : 'Créer un produit',
        onClick: hasFilters ? onResetFilters : onCreate,
      }}
    />
  );
}


