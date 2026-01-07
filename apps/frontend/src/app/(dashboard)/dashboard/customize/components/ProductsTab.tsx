'use client';

/**
 * ProductsTab - Onglet de gestion des produits
 * Composant < 300 lignes
 */

import React, { useMemo, useState } from 'react';
import { Search, Package, Grid3x3, List, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import type { Product, ProductCategory, ProductStatus } from '@/lib/types/product';
import { ProductCard } from './ProductCard';
import { ProductListView } from './ProductListView';

interface ProductsTabProps {
  products: Product[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Toutes les catégories' },
  { value: 'CLOTHING', label: 'Vêtements' },
  { value: 'ACCESSORIES', label: 'Accessoires' },
  { value: 'HOME', label: 'Maison' },
  { value: 'ELECTRONICS', label: 'Électronique' },
  { value: 'OTHER', label: 'Autre' },
];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'ARCHIVED', label: 'Archivé' },
];

export function ProductsTab({
  products,
  loading,
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
}: ProductsTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Package className="w-16 h-16 text-slate-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucun produit trouvé</h3>
          <p className="text-slate-400 text-center mb-4">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Aucun produit ne correspond à vos critères'
              : 'Créez votre premier produit personnalisable'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-700 text-white"
          />
        </div>
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-900 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-900 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-cyan-600' : 'border-slate-700'}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-cyan-600' : 'border-slate-700'}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Products Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <motion
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <ProductListView products={filteredProducts} />
      )}

      <div className="text-center text-slate-400 text-sm">
        {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
      </div>
    </div>
  );
}






