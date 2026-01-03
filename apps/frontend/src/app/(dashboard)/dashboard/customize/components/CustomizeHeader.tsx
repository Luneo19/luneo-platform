'use client';

/**
 * CustomizeHeader - Header de la page Customize
 * Composant < 300 lignes
 */

import React from 'react';
import { Palette, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomizeHeaderProps {
  onRefresh: () => void;
  onNewProduct: () => void;
}

export function CustomizeHeader({ onRefresh, onNewProduct }: CustomizeHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <Palette className="w-8 h-8 text-cyan-400" />
          Personnalisation
        </h1>
        <p className="text-slate-400">
          Gérez vos produits personnalisables, templates et analytics
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onRefresh}
          className="border-slate-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
        <Button
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
          onClick={onNewProduct}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau produit
        </Button>
      </div>
    </div>
  );
}


