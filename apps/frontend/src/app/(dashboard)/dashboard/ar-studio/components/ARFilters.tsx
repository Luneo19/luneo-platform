/**
 * Filtres pour AR Studio
 */

'use client';

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
  return (
    <Card className="p-4 bg-gray-800/50 border-gray-700">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher des modèles..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-gray-900 border-gray-600 text-white pl-10"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Select value={filterType} onValueChange={onFilterTypeChange}>
            <SelectTrigger className="w-48 bg-gray-900 border-gray-600 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {MODEL_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
            <SelectTrigger className="w-40 bg-gray-900 border-gray-600 text-white">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as 'grid' | 'list')}>
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="grid" className="data-[state=active]:bg-gray-700">
                <Grid className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-gray-700">
                <List className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="mt-3 text-sm text-gray-400">
        {modelsCount} modèle{modelsCount > 1 ? 's' : ''} trouvé{modelsCount > 1 ? 's' : ''}
      </div>
    </Card>
  );
}



