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
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Layers className="w-8 h-8 text-purple-400" />
          Templates IA
        </h1>
        <p className="text-white/60 mt-1">
          Bibliothèque de templates générés par IA
        </p>
      </div>
      <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as ViewMode)}>
        <TabsList className="dash-card border-white/[0.06] bg-white/[0.04] p-1">
          <TabsTrigger value="grid" className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04]">
            <Grid className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="list" className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80 hover:bg-white/[0.04]">
            <List className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
