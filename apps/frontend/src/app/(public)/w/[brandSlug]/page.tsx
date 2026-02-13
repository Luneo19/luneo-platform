'use client';

/**
 * Brand Storefront - Product Catalog
 * Public page for browsing a brand's products
 * URL: /w/[brandSlug]
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Sparkles,
  ArrowRight,
  Grid3X3,
  List,
  SlidersHorizontal,
  Eye,
  Box,
} from 'lucide-react';
import { CartButton } from '@/components/cart/CartDrawer';
import { logger } from '@/lib/logger';

// ========================================
// TYPES
// ========================================

interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  industry?: string;
}

interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  tags?: string[];
  baseImageUrl?: string;
  thumbnailUrl?: string;
  images?: string[];
  arEnabled?: boolean;
}

interface StoreData {
  brand: Brand;
  products: Product[];
  categories: string[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

function formatPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(price);
}

// ========================================
// STOREFRONT PAGE
// ========================================

export default function BrandStorefrontPage() {
  const params = useParams();
  const brandSlug = params.brandSlug as string;

  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch brand + products
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const url = new URL(`${window.location.origin}/api/storefront/${brandSlug}`);
        if (searchQuery) url.searchParams.set('search', searchQuery);
        if (selectedCategory) url.searchParams.set('category', selectedCategory);

        const res = await fetch(url.toString());
        if (!res.ok) {
          if (res.status === 404) throw new Error('Marque introuvable');
          throw new Error('Erreur de chargement');
        }
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        logger.error('Storefront fetch error', { error: err, brandSlug });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [brandSlug, searchQuery, selectedCategory]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  if (loading && !data) {
    return <StorefrontSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Marque introuvable</h1>
          <p className="text-muted-foreground mb-4">{error || 'Cette marque n\'existe pas'}</p>
          <Link href="/">
            <Button>Retour</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { brand, products, categories, pagination } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Brand header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-4">
            {brand.logo && (
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-white/20"
              />
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{brand.name}</h1>
              {brand.industry && (
                <Badge variant="secondary" className="mt-1 bg-white/10 text-white/80">
                  {brand.industry}
                </Badge>
              )}
            </div>
            <div className="ml-auto">
              <CartButton />
            </div>
          </div>
          {brand.description && (
            <p className="text-lg text-white/70 max-w-2xl">{brand.description}</p>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher un produit..."
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Categories */}
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Tous
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              >
                {cat}
              </Button>
            ))}

            {/* View toggle */}
            <div className="flex border rounded-lg ml-2">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-r-none ${viewMode === 'grid' ? 'bg-muted' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-l-none ${viewMode === 'list' ? 'bg-muted' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mt-3">
          {pagination.total} produit{pagination.total > 1 ? 's' : ''}
          {selectedCategory && ` dans "${selectedCategory}"`}
          {searchQuery && ` pour "${searchQuery}"`}
        </p>
      </div>

      {/* Products Grid */}
      <div className="container max-w-6xl mx-auto px-4 pb-12">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <SlidersHorizontal className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-lg font-medium">Aucun produit trouvé</p>
            <p className="text-sm text-muted-foreground mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} brand={brand} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <ProductListItem key={product.id} product={product} brand={brand} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// PRODUCT CARD
// ========================================

function ProductCard({ product, brand }: { product: Product; brand: Brand }) {
  const imageUrl = product.thumbnailUrl || product.baseImageUrl || (product.images && product.images[0]);
  const href = `/w/${brand.slug || brand.id}/${product.slug || product.id}`;

  return (
    <Link href={href}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Box className="w-16 h-16" />
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {product.arEnabled && (
              <Badge className="bg-purple-600/90 text-white text-[10px]">
                <Eye className="w-3 h-3 mr-0.5" />
                AR
              </Badge>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button size="sm" className="bg-white text-black hover:bg-white/90 shadow-lg">
              <Sparkles className="w-4 h-4 mr-1" />
              Personnaliser
            </Button>
          </div>
        </div>

        {/* Info */}
        <CardContent className="p-4">
          <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
          )}
          <div className="flex items-center justify-between mt-3">
            <span className="font-bold">{formatPrice(Number(product.price), product.currency)}</span>
            {product.category && (
              <Badge variant="outline" className="text-[10px]">
                {product.category}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ========================================
// PRODUCT LIST ITEM
// ========================================

function ProductListItem({ product, brand }: { product: Product; brand: Brand }) {
  const imageUrl = product.thumbnailUrl || product.baseImageUrl || (product.images && product.images[0]);
  const href = `/w/${brand.slug || brand.id}/${product.slug || product.id}`;

  return (
    <Link href={href}>
      <Card className="group hover:shadow-md transition-all cursor-pointer">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Box className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium group-hover:text-primary transition-colors">{product.name}</h3>
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{product.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {product.category && <Badge variant="outline" className="text-[10px]">{product.category}</Badge>}
              {product.arEnabled && <Badge className="bg-purple-100 text-purple-700 text-[10px]">AR</Badge>}
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-lg">{formatPrice(Number(product.price), product.currency)}</span>
            <div className="mt-1">
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ========================================
// SKELETON
// ========================================

function StorefrontSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gray-900 py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <Skeleton className="h-16 w-16 rounded-xl bg-gray-700" />
          <Skeleton className="h-10 w-64 mt-4 bg-gray-700" />
          <Skeleton className="h-6 w-96 mt-2 bg-gray-700" />
        </div>
      </div>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-5 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
