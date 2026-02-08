/**
 * Header de la page AI Studio Templates
 */

'use client';

import { Layers, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ViewMode } from '../types';

interface TemplatesHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function TemplatesHeader({ viewMode, onViewModeChange }: TemplatesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Layers className="w-8 h-8 text-purple-400" />
          Templates IA
        </h1>
        <p className="text-gray-600 mt-1">
          Bibliothèque de templates générés par IA
        </p>
      </div>
      <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as ViewMode)}>
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
  );
}



