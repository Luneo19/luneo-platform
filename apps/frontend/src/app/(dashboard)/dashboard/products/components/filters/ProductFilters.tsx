/**
 * Composant de filtres pour les produits
 */

'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { CATEGORIES, STATUS_OPTIONS, SORT_OPTIONS, VIEW_MODES } from '../../constants/products';
import { cn } from '@/lib/utils';
import type { ProductFilters, SortOption } from '../../types';

interface ProductFiltersProps {
  filters: ProductFilters;
  sortOption: SortOption;
  viewMode: 'grid' | 'list';
  showFilters: boolean;
  onFiltersChange: (filters: ProductFilters) => void;
  onSortChange: (option: SortOption) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onResetFilters: () => void;
}

export function ProductFilters({
  filters,
  sortOption,
  viewMode,
  showFilters,
  onFiltersChange,
  onSortChange,
  onViewModeChange,
  onResetFilters,
}: ProductFiltersProps) {
  const handleSort = (value: string) => {
    const [field, direction] = value.split('-');
    onSortChange({
      field: field as SortOption['field'],
      direction: direction as 'asc' | 'desc',
    });
  };

  return (
    <Card className="p-4 bg-gray-800/50 border-gray-700">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            placeholder="Rechercher par nom, description, SKU, tags..."
            className="pl-10 bg-gray-900 border-gray-600 text-white"
          />
        </div>

        {/* Category Filter */}
        <Select
          value={filters.category}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, category: value })
          }
        >
          <SelectTrigger className="w-[180px] bg-gray-900 border-gray-600 text-white">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value })
          }
        >
          <SelectTrigger className="w-[180px] bg-gray-900 border-gray-600 text-white">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full bg-${status.color}-500`}
                  />
                  {status.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={`${sortOption.field}-${sortOption.direction}`}
          onValueChange={handleSort}
        >
          <SelectTrigger className="w-[200px] bg-gray-900 border-gray-600 text-white">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 border border-gray-700 rounded-lg p-1 bg-gray-900">
          {Object.entries(VIEW_MODES).map(([mode, config]) => {
            const Icon = config.icon;
            return (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange(mode as 'grid' | 'list')}
                className={cn(
                  'h-8',
                  viewMode === mode
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
              </Button>
            );
          })}
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-gray-700 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-300">Prix minimum</Label>
                <Input
                  type="number"
                  value={filters.priceMin || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      priceMin: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="0.00"
                  className="bg-gray-900 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Prix maximum</Label>
                <Input
                  type="number"
                  value={filters.priceMax || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      priceMax: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="9999.99"
                  className="bg-gray-900 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Date de début</Label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      dateFrom: e.target.value || null,
                    })
                  }
                  className="bg-gray-900 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Date de fin</Label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      dateTo: e.target.value || null,
                    })
                  }
                  className="bg-gray-900 border-gray-600 text-white mt-1"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="active-only"
                    checked={filters.isActive === true}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...filters,
                        isActive: checked ? true : null,
                      })
                    }
                  />
                  <Label htmlFor="active-only" className="text-gray-300 cursor-pointer">
                    Actifs uniquement
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="public-only"
                    checked={filters.isPublic === true}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...filters,
                        isPublic: checked ? true : null,
                      })
                    }
                  />
                  <Label htmlFor="public-only" className="text-gray-300 cursor-pointer">
                    Publics uniquement
                  </Label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetFilters}
                  className="border-gray-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </div>
          </motion>
        )}
      </AnimatePresence>
    </Card>
  );
}



