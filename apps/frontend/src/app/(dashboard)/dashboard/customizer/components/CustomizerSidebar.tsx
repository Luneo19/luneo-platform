'use client';

import React from 'react';
import { Search, Grid3x3, List } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, STATUS_OPTIONS, VIEW_MODES } from '../data';
import type { ProductFilters } from '../types';
import type { ViewModeKey } from '../data';

export interface CustomizerSidebarProps {
  filters: ProductFilters;
  onFiltersChange: (updates: Partial<ProductFilters>) => void;
  viewMode: ViewModeKey;
  onViewModeToggle: () => void;
}

export function CustomizerSidebar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeToggle,
}: CustomizerSidebarProps) {
  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600" />
            <Input
              placeholder="Rechercher un produit..."
              value={filters.search ?? ''}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-10 bg-white border-gray-200 text-gray-900"
            />
          </div>
          <Select
            value={filters.category ?? 'all'}
            onValueChange={(value) => onFiltersChange({ category: value })}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-white border-gray-200 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 text-gray-900">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(value) => onFiltersChange({ status: value })}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-white border-gray-200 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 text-gray-900">
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onViewModeToggle}
              className="border-gray-200"
            >
              {viewMode === 'grid' ? (
                <List className="w-4 h-4" />
              ) : (
                <Grid3x3 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
