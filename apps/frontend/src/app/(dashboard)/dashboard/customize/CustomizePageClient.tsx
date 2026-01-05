'use client';

/**
 * CustomizePageClient - Client Component minimal
 * 
 * Gère uniquement les interactions UI et le state local
 * Data fetching via tRPC dans le composant
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/lib/trpc/client';
import type { Product, ProductCategory, ProductStatus } from '@/lib/types/product';
import { CustomizeStats } from './components/CustomizeStats';
import { ProductsTab } from './components/ProductsTab';
import { TemplatesTab } from './components/TemplatesTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { HistoryTab } from './components/HistoryTab';
import { CustomizeHeader } from './components/CustomizeHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ActiveTab = 'products' | 'templates' | 'analytics' | 'history';

export function CustomizePageClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch products via tRPC
  const productsQuery = trpc.product.list.useQuery({
    search: searchTerm || undefined,
    category: categoryFilter !== 'all' ? (categoryFilter as ProductCategory) : undefined,
  });

  const products = useMemo(() => {
    return (productsQuery.data?.products || []) as Product[];
  }, [productsQuery.data]);

  const handleRefresh = useCallback(() => {
    productsQuery.refetch();
    toast({
      title: 'Actualisation',
      description: 'Les produits ont été actualisés',
    });
  }, [productsQuery, toast]);

  return (
    <div className="space-y-6 pb-10">
      <CustomizeHeader
        onRefresh={handleRefresh}
        onNewProduct={() => router.push('/dashboard/products')}
      />

      <CustomizeStats products={products} />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-700">
          <TabsTrigger value="products" className="data-[state=active]:bg-cyan-600">
            Produits
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-cyan-600">
            Templates
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-600">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-cyan-600">
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <ProductsTab
            products={products}
            loading={productsQuery.isLoading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab products={products} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}




