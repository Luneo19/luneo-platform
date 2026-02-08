'use client';

import React from 'react';
import { Palette, LayoutTemplate, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CustomizerTab } from '../types';

export interface CustomizerToolbarProps {
  activeTab: CustomizerTab;
  onTabChange: (value: CustomizerTab) => void;
  onOpenTemplates: () => void;
  onOpenAssets: () => void;
  productsCount: number;
  templatesCount: number;
  assetsCount: number;
}

export function CustomizerToolbar({
  activeTab,
  onTabChange,
  onOpenTemplates,
  onOpenAssets,
  productsCount,
  templatesCount,
  assetsCount,
}: CustomizerToolbarProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Palette className="w-8 h-8 text-cyan-400" />
            Customizer
          </h1>
          <p className="text-gray-600 mt-1">
            Personnalisez vos produits avec notre éditeur visuel avancé
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onOpenTemplates}
            className="border-gray-200"
          >
            <LayoutTemplate className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button
            variant="outline"
            onClick={onOpenAssets}
            className="border-gray-200"
          >
            <Folder className="w-4 h-4 mr-2" />
            Bibliothèque
          </Button>
        </div>
      </div>

      <TabsList className="bg-gray-50 border border-gray-200">
        <TabsTrigger value="products" className="data-[state=active]:bg-cyan-600">
          Produits ({productsCount})
        </TabsTrigger>
        <TabsTrigger value="templates" className="data-[state=active]:bg-cyan-600">
          Templates ({templatesCount})
        </TabsTrigger>
        <TabsTrigger value="assets" className="data-[state=active]:bg-cyan-600">
          Bibliothèque ({assetsCount})
        </TabsTrigger>
        <TabsTrigger value="history" className="data-[state=active]:bg-cyan-600">
          Historique
        </TabsTrigger>
      </TabsList>
    </>
  );
}
