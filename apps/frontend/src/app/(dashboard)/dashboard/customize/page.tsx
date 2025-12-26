'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Palette,
  Package,
  Search,
  Grid,
  List,
  Plus,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface Product {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  customizable: boolean;
  designsCount: number;
}

/**
 * Customize - Page de personnalisation générale
 * Liste des produits personnalisables
 */
export default function CustomizePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Charger les produits depuis l'API
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products?customizable=true', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const apiProducts = result.data?.products || result.products || [];
      
      const transformedProducts: Product[] = apiProducts.map((product: any) => ({
        id: product.id,
        name: product.name || 'Produit sans nom',
        thumbnail: product.thumbnailUrl || product.thumbnail_url || '/placeholder-product.jpg',
        category: product.category || 'other',
        customizable: product.customizable !== false,
        designsCount: product.designsCount || product.designs_count || 0,
      }));

      setProducts(transformedProducts);
    } catch (error) {
      logger.error('Error loading products', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les produits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <ErrorBoundary componentName="Customize">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Palette className="w-8 h-8 text-cyan-400" />
              Personnalisation
            </h1>
            <p className="text-slate-400 mt-2">
              Sélectionnez un produit à personnaliser
            </p>
          </div>
          <Button
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
            onClick={() => router.push('/dashboard/products')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau produit
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1 border border-slate-700 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-slate-700' : ''}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-slate-700' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Chargement des produits...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="w-16 h-16 text-slate-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Aucun produit trouvé
              </h3>
              <p className="text-slate-400 text-center mb-4">
                {searchTerm || categoryFilter !== 'all'
                  ? 'Aucun produit ne correspond à vos critères'
                  : 'Créez votre premier produit personnalisable'}
              </p>
              <Button
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                onClick={() => router.push('/dashboard/products')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer un produit
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-900/50 border-slate-700 overflow-hidden hover:border-cyan-500/50 transition-all group">
                  <div className="relative aspect-square bg-slate-800">
                    <img
                      src={product.thumbnail}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {product.customizable && (
                      <Badge className="absolute top-2 right-2 bg-green-500">
                        Personnalisable
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-2 truncate">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {product.designsCount} design{product.designsCount !== 1 ? 's' : ''}
                      </span>
                      <Link href={`/dashboard/customize/${product.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white truncate">{product.name}</h3>
                          {product.customizable && (
                            <Badge className="bg-green-500">Personnalisable</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">
                          {product.designsCount} design{product.designsCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/customize/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

