/**
 * Client Component pour la page Library
 */

'use client';

import { useState, useEffect } from 'react';
import { LibraryHeader } from './components/LibraryHeader';
import { LibraryFilters } from './components/LibraryFilters';
import { LibraryGrid } from './components/LibraryGrid';
import { AssetPreviewModal } from './components/modals/AssetPreviewModal';
import { UploadModal } from './components/modals/UploadModal';
import { useLibrary } from './hooks/useLibrary';
import { useLibraryUpload } from './hooks/useLibraryUpload';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { Template, ViewMode, SortOption } from './types';

export function LibraryPageClient() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [page, setPage] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { templates, isLoading, hasMore, toggleFavorite, deleteTemplate } = useLibrary(
    page,
    categoryFilter,
    searchTerm,
    sortBy
  );

  const { uploadFiles, isUploading, uploadProgress, openFileDialog } = useLibraryUpload();

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, searchTerm, sortBy]);

  const loadMore = () => {
    if (!hasMore || isLoading) return;
    setPage((prev) => prev + 1);
  };

  const { Sentinel } = useInfiniteScroll({
    hasMore,
    loading: isLoading,
    onLoadMore: loadMore,
    threshold: 200,
  });

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleDelete = async (templateId: string) => {
    const result = await deleteTemplate(templateId);
    if (result.success && previewTemplate?.id === templateId) {
      setShowPreview(false);
      setPreviewTemplate(null);
    }
  };

  if (isLoading && page === 1) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-16 bg-gray-800 rounded animate-pulse" />
        <div className="h-20 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <LibraryHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onUpload={() => setShowUploadModal(true)}
      />
      <LibraryFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        templatesCount={templates.length}
      />
      <LibraryGrid
        templates={templates}
        onPreview={handlePreview}
        onToggleFavorite={toggleFavorite}
        onDelete={handleDelete}
      />
      <Sentinel />

      <AssetPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        template={previewTemplate}
        onToggleFavorite={toggleFavorite}
        onDelete={handleDelete}
      />

      <UploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUpload={uploadFiles}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />
    </div>
  );
}



