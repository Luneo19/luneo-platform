'use client';

import React, { memo } from 'react';
import dynamic from 'next/dynamic';
import { Tabs } from '@/components/ui/tabs';
import { useCustomizer } from '../hooks/useCustomizer';
import { CustomizerToolbar } from './CustomizerToolbar';
import { CustomizerSidebar } from './CustomizerSidebar';
import { CustomizerCanvas } from './CustomizerCanvas';
import { CustomizerModals } from './CustomizerModals';
import type { CustomizerTab } from '../types';
import type { ViewModeKey } from '../data';

const ProductCustomizer = dynamic(
  () =>
    import('@/components/Customizer/ProductCustomizer').then((mod) => ({
      default: mod.ProductCustomizer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-slate-900/50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4" />
          <p className="text-slate-400">Chargement de l&apos;éditeur...</p>
        </div>
      </div>
    ),
  }
);

function CustomizerPageViewInner() {
  const {
    viewMode,
    setViewMode,
    filters,
    setFilters,
    activeTab,
    setActiveTab,
    showTemplates,
    setShowTemplates,
    showAssets,
    setShowAssets,
    productsQuery,
    filteredProducts,
    templates,
    assets,
    handleOpenCustomizer,
    handleCloseCustomizer,
    handleSaveDesign,
    selectedProduct,
    showCustomizer,
  } = useCustomizer();

  const productImage =
    selectedProduct &&
    ('image_url' in selectedProduct
      ? (selectedProduct as { image_url?: string }).image_url
      : (selectedProduct as { images?: string[]; baseAssetUrl?: string }).images?.[0] ||
        (selectedProduct as { baseAssetUrl?: string }).baseAssetUrl) ||
    '';

  return (
    <div className="space-y-6 pb-10">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CustomizerTab)} className="space-y-6">
        <CustomizerToolbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenTemplates={() => setShowTemplates(true)}
          onOpenAssets={() => setShowAssets(true)}
          productsCount={filteredProducts.length}
          templatesCount={templates.length}
          assetsCount={assets.length}
        />
        {activeTab === 'products' && (
          <CustomizerSidebar
            filters={filters}
            onFiltersChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
            viewMode={viewMode as ViewModeKey}
            onViewModeToggle={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          />
        )}
        <CustomizerCanvas
          activeTab={activeTab}
          viewMode={viewMode as 'grid' | 'list'}
          products={filteredProducts}
          productsLoading={productsQuery.isLoading}
          templates={templates}
          assets={assets}
          onOpenCustomizer={handleOpenCustomizer}
        />
      </Tabs>

      {showCustomizer && selectedProduct && (
        <ProductCustomizer
          productId={selectedProduct.id}
          productImage={productImage}
          productName={selectedProduct.name}
          onSave={handleSaveDesign}
          onClose={handleCloseCustomizer}
          mode="live"
        />
      )}

      <CustomizerModals
        showTemplates={showTemplates}
        onTemplatesChange={setShowTemplates}
        showAssets={showAssets}
        onAssetsChange={setShowAssets}
        templates={templates}
        assets={assets}
      />
    </div>
  );
}

export const CustomizerPageView = memo(CustomizerPageViewInner);
