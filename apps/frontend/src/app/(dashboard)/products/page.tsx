'use client';

import React, { useState, useMemo, memo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, Filter, Package, Eye, Edit } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductsSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-states/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { trpc } from '@/lib/trpc/client';
import { useI18n } from '@/i18n/useI18n';

interface ProductListItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  image_url: string;
  price: number;
}

/** Raw product from trpc product.list */
interface RawProductItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  images?: string[];
  price?: number;
}

function ProductsPageContent() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Query products from tRPC
  const productsQuery = trpc.product.list.useQuery({
    search: searchTerm || undefined,
    category: categoryFilter !== 'all' ? (categoryFilter.toUpperCase() as 'OTHER' | 'JEWELRY' | 'WATCHES' | 'GLASSES' | 'ACCESSORIES' | 'HOME' | 'TECH') : undefined,
    limit: 20,
    offset: (page - 1) * 20,
  });

  // Transform data
  const products = useMemo((): ProductListItem[] => {
    const apiProducts = (productsQuery.data?.products || []) as unknown as RawProductItem[];
    return apiProducts.map((p: RawProductItem) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category || 'other',
      image_url: p.imageUrl || p.images?.[0] || '/placeholder-product.svg',
      price: p.price || 0,
    }));
  }, [productsQuery.data]);
  const loading = productsQuery.isLoading;
  const error = productsQuery.isError ? productsQuery.error?.message || null : null;

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter((p: ProductListItem) => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const handleRetry = useCallback(() => {
    productsQuery.refetch();
  }, [productsQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Products</h1>
          <p className="text-white/60">{products.length} produits</p>
        </div>
        <Link href="/dashboard/products">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau produit
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un produit..."
              className="dash-input pl-10 border-white/[0.08] text-white placeholder:text-white/40"
            />
          </div>
        </div>
        <Button variant="outline" className="border-white/[0.08] text-white/60 hover:bg-white/[0.04]">
          <Filter className="w-4 h-4 mr-2" />
          Filtres
        </Button>
      </div>

      {/* Error State */}
      {error && !loading && (
        <Card className="dash-card p-6 bg-[#1a1a2e]/80 border-white/[0.06] border-[#f87171]/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#f87171] mb-2">Erreur de chargement</h3>
              <p className="text-sm text-white/60">{error}</p>
            </div>
            <Button onClick={handleRetry} variant="outline" className="border-white/[0.08] text-white/80 hover:bg-white/[0.04]">
              Réessayer
            </Button>
          </div>
        </Card>
      )}

      {/* Products Grid */}
      {loading ? (
        <ProductsSkeleton />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="w-16 h-16 text-white/40" />}
          title={searchTerm ? t('common.noProductFound') : t('common.noProduct')}
          description={searchTerm
            ? t('common.noProductMatchDescription', { search: searchTerm })
            : t('common.noProductCreateDescription')}
          action={{
            label: searchTerm ? t('common.clearSearch') : t('common.createProduct'),
            onClick: () => {
              if (searchTerm) {
                setSearchTerm('');
              } else {
                window.location.href = '/dashboard/products';
              }
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product: ProductListItem) => (
            <Card
              key={product.id}
              className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden hover:bg-white/[0.05] hover:border-white/[0.10] transition-all group"
            >
              <div className="aspect-square bg-[#12121a] relative">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Link href={`/customize/${product.id}`}>
                      <Button size="sm" className="bg-white text-[#0a0a0f] hover:bg-white/90">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/products/${product.id}`}>
                      <Button size="sm" variant="outline" className="border-white/60 text-white hover:bg-white/[0.08]">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white mb-1 truncate">{product.name}</h3>
                <p className="text-sm text-white/60">{product.category || 'Uncategorized'}</p>
                {product.price && (
                  <p className="text-lg font-bold text-purple-400 mt-2">{product.price}€</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const MemoizedProductsPageContent = memo(ProductsPageContent);

export default function ProductsPage() {
  return (
    <ErrorBoundary level="page" componentName="ProductsPage">
      <MemoizedProductsPageContent />
    </ErrorBoundary>
  );
}
