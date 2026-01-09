/**
 * Header de la page Products
 */

import { Package, Plus, Upload, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ProductFilters } from '../types';

interface ProductsHeaderProps {
  stats: {
    total: number;
    active: number;
  };
  filters: ProductFilters;
  onShowFilters: () => void;
  onShowCreate: () => void;
  onImport: () => void;
  importing?: boolean;
}

export function ProductsHeader({
  stats,
  filters,
  onShowFilters,
  onShowCreate,
  onImport,
  importing = false,
}: ProductsHeaderProps) {
  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== null && v !== '' && v !== 'all'
  ).length;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Package className="w-8 h-8 text-cyan-400" />
          Produits
        </h1>
        <p className="text-gray-400 mt-1">
          {stats.total} produit{stats.total > 1 ? 's' : ''} • {stats.active} actif
          {stats.active > 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onShowFilters}
          className="border-gray-700"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtres
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onImport}
          disabled={importing}
          className="border-gray-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Importer
        </Button>
        <Button
          onClick={onShowCreate}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau produit
        </Button>
      </div>
    </div>
  );
}



