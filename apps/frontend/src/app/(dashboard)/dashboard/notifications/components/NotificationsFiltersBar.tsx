'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Grid, List, Calendar } from 'lucide-react';
import { typeConfig, priorityConfig } from './constants';

interface NotificationsFiltersBarProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  filterType: string;
  onFilterTypeChange: (v: string) => void;
  filterPriority: string;
  onFilterPriorityChange: (v: string) => void;
  filterStatus: string;
  onFilterStatusChange: (v: string) => void;
  viewMode: 'list' | 'grid';
  onViewModeToggle: () => void;
  groupByDate: boolean;
  onGroupByDateToggle: () => void;
}

export function NotificationsFiltersBar({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterPriority,
  onFilterPriorityChange,
  filterStatus,
  onFilterStatusChange,
  viewMode,
  onViewModeToggle,
  groupByDate,
  onGroupByDateToggle,
}: NotificationsFiltersBarProps) {
  return (
    <Card className="p-4 bg-zinc-800/50 border-zinc-700">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <Input
            placeholder="Rechercher une notification..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-600 text-white"
          />
        </div>
        <Select value={filterType} onValueChange={onFilterTypeChange}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-600 text-white">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(typeConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={onFilterPriorityChange}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-600 text-white">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les priorités</SelectItem>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-600 text-white">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="read">Lues</SelectItem>
            <SelectItem value="unread">Non lues</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onViewModeToggle} className="border-zinc-600">
            {viewMode === 'list' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={onGroupByDateToggle} className="border-zinc-600">
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
