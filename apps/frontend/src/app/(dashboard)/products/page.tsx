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

function ProductsPageContent() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Query products from tRPC
  const productsQuery = trpc.product.list.useQuery({
    search: searchTerm || undefined,
    category: categoryFilter !== 'all' ? (categoryFilter.toUpperCase() as any) : undefined,
    limit: 20,
    offset: (page - 1) * 20,
  });

  // Transform data
  const products = useMemo(() => {
    const apiProducts = productsQuery.data?.products || [];
    return apiProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category || 'other',
      image_url: p.imageUrl || p.images?.[0] || `https://picsum.photos/seed/${p.id}/400/400`,
      price: p.price || 0,
    }));
  }, [productsQuery.data]);
  const loading = productsQuery.isLoading;
  const error = productsQuery.isError ? productsQuery.error?.message || null : null;

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter((p) => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));
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
          <p className="text-gray-400">{products.length} produits</p>
        </div>
        <Link href="/dashboard/products">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau produit
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un produit..."
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>
        <Button variant="outline" className="border-gray-700 text-gray-300">
          <Filter className="w-4 h-4 mr-2" />
          Filtres
        </Button>
      </div>

      {/* Error State */}
      {error && !loading && (
        <Card className="p-6 bg-red-900/20 border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">Erreur de chargement</h3>
              <p className="text-sm text-red-300">{error}</p>
            </div>
            <Button onClick={handleRetry} variant="outline" className="border-red-500/50 text-red-400">
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
          icon={<Package className="w-16 h-16" />}
          title={searchTerm ? "Aucun produit trouvé" : "Aucun produit"}
          description={searchTerm 
            ? `Aucun produit ne correspond à "${searchTerm}". Essayez avec d'autres mots-clés.`
            : "Créez votre premier produit pour commencer à personnaliser et vendre."}
          action={{
            label: searchTerm ? "Effacer la recherche" : "Créer un produit",
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
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all group">
              <div className="aspect-square bg-gray-900 relative">
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
                    <Package className="w-16 h-16 text-gray-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Link href={`/customize/${product.id}`}>
                      <Button size="sm" className="bg-white text-gray-900">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/products/${product.id}`}>
                      <Button size="sm" variant="outline" className="border-white text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white mb-1 truncate">{product.name}</h3>
                <p className="text-sm text-gray-400">{product.category || 'Uncategorized'}</p>
                {product.price && (
                  <p className="text-lg font-bold text-blue-400 mt-2">{product.price}€</p>
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
