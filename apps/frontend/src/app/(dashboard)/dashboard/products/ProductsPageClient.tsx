/**
 * Client Component principal pour la page Products
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { ProductsHeader } from './components/ProductsHeader';
import { ProductsStats } from './components/ProductsStats';
import { ProductFilters } from './components/filters/ProductFilters';
import { ProductsGrid } from './components/table/ProductsGrid';
import { ProductsTable } from './components/table/ProductsTable';
import { BulkActionsBar } from './components/BulkActionsBar';
import { ProductsEmptyState } from './components/ProductsEmptyState';
import { CreateProductModal } from './components/modals/CreateProductModal';
import { EditProductModal } from './components/modals/EditProductModal';
import { ExportModal } from './components/modals/ExportModal';
import { useProducts } from './hooks/useProducts';
import { useProductActions } from './hooks/useProductActions';
import { useProductExport } from './hooks/useProductExport';
import { useProductImport } from './hooks/useProductImport';
import type { ProductFilters as ProductFiltersType, SortOption } from './types';
import type { Product } from '@/lib/types/product';

export function ProductsPageClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<ProductFiltersType>({
    search: '',
    category: 'all',
    status: 'all',
    priceMin: null,
    priceMax: null,
    dateFrom: null,
    dateTo: null,
    isActive: null,
    isPublic: null,
  });
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'createdAt',
    direction: 'desc',
  });
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>(
    'csv'
  );

  // Hooks
  const { products, stats, isLoading, refetch } = useProducts(
    filters,
    sortOption,
    page
  );
  const {
    handleCreateProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleBulkAction,
  } = useProductActions();
  const { exportProducts } = useProductExport();
  const { handleImport, importing } = useProductImport(() => refetch());

  // Handlers
  const toggleProductSelection = useCallback((productId: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  }, [selectedProducts.size, products]);

  const handleCreate = useCallback(
    async (productData: Partial<Product>): Promise<{ success: boolean }> => {
      const result = await handleCreateProduct(productData);
      if (result.success) {
        await refetch();
      }
      return result;
    },
    [handleCreateProduct, refetch]
  );

  const handleEdit = useCallback(
    async (productId: string, productData: Partial<Product>): Promise<{ success: boolean }> => {
      const result = await handleEditProduct(productId, productData);
      if (result.success) {
        await refetch();
      }
      return result;
    },
    [handleEditProduct, refetch]
  );

  const handleDelete = useCallback(
    async (productId: string) => {
      const result = await handleDeleteProduct(productId);
      if (result.success) {
        await refetch();
      }
    },
    [handleDeleteProduct, refetch]
  );

  const handleBulk = useCallback(
    async (action: 'delete' | 'archive' | 'activate' | 'deactivate' | 'export') => {
      if (action === 'export') {
        setShowExportModal(true);
        return;
      }
      const result = await handleBulkAction(
        action,
        Array.from(selectedProducts),
        () => {
          setSelectedProducts(new Set());
          refetch();
        }
      );
      if (result.success) {
        setSelectedProducts(new Set());
      }
    },
    [selectedProducts, handleBulkAction, refetch]
  );

  const handleExport = useCallback(async () => {
    const productsToExport =
      selectedProducts.size > 0
        ? products.filter((p) => selectedProducts.has(p.id))
        : products;
    await exportProducts(productsToExport, exportFormat);
    setShowExportModal(false);
  }, [selectedProducts, products, exportFormat, exportProducts]);


  const handleView = useCallback(
    (productId: string) => {
      router.push(`/dashboard/products/${productId}`);
    },
    [router]
  );

  // Loading state
  if (isLoading && products.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <ProductsHeader
        stats={stats}
        filters={filters}
        onShowFilters={() => setShowFilters(!showFilters)}
        onShowCreate={() => setShowCreateModal(true)}
        onImport={() => fileInputRef.current?.click()}
        importing={importing}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleImport(file);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        }}
      />

      {/* Stats */}
      <ProductsStats stats={stats} />

      {/* Filters */}
      <ProductFilters
        filters={filters}
        sortOption={sortOption}
        viewMode={viewMode}
        showFilters={showFilters}
        onFiltersChange={setFilters}
        onSortChange={setSortOption}
        onViewModeChange={setViewMode}
        onResetFilters={() => {
          setFilters({
            search: '',
            category: 'all',
            status: 'all',
            priceMin: null,
            priceMax: null,
            dateFrom: null,
            dateTo: null,
            isActive: null,
            isPublic: null,
          });
        }}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedProducts.size}
        onClearSelection={() => setSelectedProducts(new Set())}
        onBulkAction={handleBulk}
      />

      {/* Products Grid/List */}
      {products.length === 0 ? (
        <ProductsEmptyState
          filters={filters}
          onCreate={() => setShowCreateModal(true)}
          onResetFilters={() => {
            setFilters({
              search: '',
              category: 'all',
              status: 'all',
              priceMin: null,
              priceMax: null,
              dateFrom: null,
              dateTo: null,
              isActive: null,
              isPublic: null,
            });
          }}
        />
      ) : viewMode === 'grid' ? (
        <ProductsGrid
          products={products}
          selectedProducts={selectedProducts}
          onSelect={toggleProductSelection}
          onEdit={(product) => {
            setEditingProduct(product as Product);
            setShowEditModal(true);
          }}
          onDelete={handleDelete}
          onView={handleView}
        />
      ) : (
        <ProductsTable
          products={products}
          selectedProducts={selectedProducts}
          onSelect={toggleProductSelection}
          onSelectAll={toggleSelectAll}
          onEdit={(product) => {
            setEditingProduct(product as Product);
            setShowEditModal(true);
          }}
          onDelete={handleDelete}
          onView={handleView}
        />
      )}

      {/* Modals */}
      <CreateProductModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreate={handleCreate}
      />

      {editingProduct && (
        <EditProductModal
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open);
            if (!open) setEditingProduct(null);
          }}
          product={editingProduct}
          onUpdate={(data) => handleEdit(editingProduct.id, data)}
        />
      )}

      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        exportFormat={exportFormat}
        onFormatChange={setExportFormat}
        onExport={handleExport}
        productCount={
          selectedProducts.size > 0 ? selectedProducts.size : products.length
        }
      />
    </div>
  );
}

