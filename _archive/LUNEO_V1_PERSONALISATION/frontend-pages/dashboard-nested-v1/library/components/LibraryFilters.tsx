/**
 * Filtres pour la page Library
 */

'use client';

import React from 'react';
import { Search, Filter } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { CATEGORIES, SORT_OPTIONS } from '../constants/library';

interface LibraryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  templatesCount: number;
}

export function LibraryFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortByChange,
  templatesCount,
}: LibraryFiltersProps) {
  const { t } = useI18n();
  return (
    <Card className="p-4 bg-white border-gray-200">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <Input
              placeholder={t('library.searchTemplates')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-white border-gray-200 text-gray-900 pl-10"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="w-48 bg-white border-gray-200 text-gray-900">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('library.category')} />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      {Icon && React.createElement(Icon as React.ElementType, { className: 'w-4 h-4' })}
                      {category.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-40 bg-white border-gray-200 text-gray-900">
              <SelectValue placeholder={t('library.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-3 text-sm text-gray-600">
        {t('library.templatesFound', { count: templatesCount })}
      </div>
    </Card>
  );
}



