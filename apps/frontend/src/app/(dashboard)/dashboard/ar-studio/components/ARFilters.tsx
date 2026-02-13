/**
 * Filtres pour AR Studio
 */

'use client';

import React from 'react';
import { useI18n } from '@/i18n/useI18n';
import { Search, Filter, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MODEL_TYPES, STATUS_OPTIONS } from '../constants/ar';

interface ARFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  modelsCount: number;
}

export function ARFilters({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  viewMode,
  onViewModeChange,
  modelsCount,
}: ARFiltersProps) {
  const { t } = useI18n();
  return (
    <Card className="p-4 bg-white border-gray-200">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <Input
              placeholder={t('arStudio.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-white border-gray-200 text-gray-900 pl-10"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Select value={filterType} onValueChange={onFilterTypeChange}>
            <SelectTrigger className="w-48 bg-gray-900 border-gray-600 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('arStudio.typeFilter')} />
            </SelectTrigger>
            <SelectContent>
              {MODEL_TYPES.map((type) => {
                const Icon = type.icon as React.ElementType;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {Icon && React.createElement(Icon, { className: 'w-4 h-4' })}
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
            <SelectTrigger className="w-40 bg-white border-gray-200 text-gray-900">
              <SelectValue placeholder={t('arStudio.statusFilter')} />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {t(status.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as 'grid' | 'list')}>
            <TabsList className="bg-gray-100 border-gray-200">
              <TabsTrigger value="grid" className="data-[state=active]:bg-gray-200">
                <Grid className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-gray-200">
                <List className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="mt-3 text-sm text-gray-400">
        {t('arStudio.modelsFound', { count: modelsCount })}
      </div>
    </Card>
  );
}



