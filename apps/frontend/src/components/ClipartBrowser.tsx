'use client';

/**
 * Clipart Browser - Professional Clipart Library
 * Complete implementation with search, filters, categories, and upload
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { LazyMotionDiv as Motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import NextImage from 'next/image';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Search,
  Grid3x3,
  List,
  Upload,
  Tag,
  Image as ImageIcon,
  Plus,
  Trash2,
  Star,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';
import { normalizeListResponse } from '@/lib/api/normalize';

interface Clipart {
  id: string;
  name: string;
  description?: string;
  category?: string;
  image_url?: string;
  svg_data?: string;
  tags?: string[];
  is_premium?: boolean;
  is_published?: boolean;
  created_at: string;
  updated_at?: string;
}

interface ClipartBrowserProps {
  className?: string;
  onClipartSelect?: (clipart: Clipart) => void;
  showUploadButton?: boolean;
}

export function ClipartBrowser({ className, onClipartSelect, showUploadButton = true }: ClipartBrowserProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [cliparts, setCliparts] = useState<Clipart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'name'>('created_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadCliparts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, selectedCategory]);

  // Filtrage optimisé avec useMemo (voir plus bas)

  const loadCliparts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 24,
        sort_by: sortBy,
        sort_order: 'desc',
      };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      const data = await api.get<{ cliparts?: Clipart[]; pagination?: { totalPages?: number } }>(
        '/api/v1/cliparts',
        { params }
      );
      const normalizedCliparts = normalizeListResponse<Clipart>((data as Record<string, unknown> | undefined)?.cliparts);
      setCliparts(normalizedCliparts);
      setTotalPages(data?.pagination?.totalPages || 1);
      const uniqueCategories = Array.from(
        new Set(normalizedCliparts.map((c: Clipart) => c.category).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      logger.error('Failed to load cliparts', { error });
      toast({
        title: t('common.error'),
        description: t('clipart.loadError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, selectedCategory, toast, t]);

  // Optimisé: utiliser useMemo au lieu de useEffect pour le filtrage
  const filteredCliparts = useMemo(() => {
    let filtered = [...cliparts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [searchQuery, cliparts]);

  const handleUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        await api.post('/api/v1/cliparts', {
          name: file.name.replace(/\.[^/.]+$/, ''),
          image_url: base64,
          category: 'uploaded',
          tags: [],
        });
        toast({
          title: t('clipart.uploadSuccess'),
          description: t('clipart.uploadSuccessDesc'),
        });
        loadCliparts();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      logger.error('Upload error', { error });
      toast({
        title: t('common.error'),
        description: t('clipart.uploadError'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, loadCliparts, t]);

  const handleSelectClipart = (clipart: Clipart) => {
    onClipartSelect?.(clipart);
    toast({
      title: t('clipart.selected'),
      description: t('clipart.selectedDesc', { name: clipart.name }),
    });
  };

  const handleDelete = async (clipartId: string) => {
    try {
      await api.delete(`/api/v1/cliparts/${clipartId}`);
      setCliparts(cliparts.filter((c) => c.id !== clipartId));
      toast({
        title: t('clipart.deleteSuccess'),
        description: t('clipart.deleteSuccessDesc'),
      });
    } catch (error) {
      logger.error('Delete error', { error, clipartId });
      toast({
        title: t('common.error'),
        description: t('clipart.deleteError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-green-400" />
            Bibliothèque de Cliparts
          </h2>
          <p className="text-gray-400">
            {cliparts.length} clipart{cliparts.length > 1 ? 's' : ''} disponible{cliparts.length > 1 ? 's' : ''}
          </p>
        </div>
        {showUploadButton && (
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*,.svg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
              disabled={isUploading}
            />
            <Button
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-pulse" />
                  Upload...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Clipart
                </>
              )}
            </Button>
          </label>
        )}
      </div>

      {/* Filters & Search */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un clipart..."
              className="pl-9 bg-gray-900 border-gray-600 text-white"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-900 border-gray-600 text-white">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-900 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Plus récents</SelectItem>
              <SelectItem value="name">Nom (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="border-gray-600"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="border-gray-600"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Cliparts Grid/List */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Chargement des cliparts...</p>
        </Card>
      ) : filteredCliparts.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <AnimatePresence>
                {filteredCliparts.map((clipart, i) => (
                  <Motion
                    key={clipart.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="overflow-hidden bg-gray-800/50 border-gray-700 group hover:border-green-500/50 transition-colors cursor-pointer">
                      <div className="aspect-square bg-gray-900 relative" onClick={() => handleSelectClipart(clipart)}>
                        {clipart.image_url ? (
                          <NextImage
                            src={clipart.image_url}
                            alt={clipart.name}
                            fill
                            className="object-contain p-2"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-gray-600" />
                          </div>
                        )}
                        {clipart.is_premium && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-yellow-500 text-black">
                              <Star className="w-3 h-3 mr-1" />
                              Pro
                            </Badge>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectClipart(clipart);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Utiliser
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(clipart.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-white mb-1 line-clamp-1 font-medium">{clipart.name}</p>
                        {clipart.category && (
                          <Badge variant="outline" className="border-gray-600 text-xs">
                            {clipart.category}
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </Motion>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCliparts.map((clipart) => (
                <Card
                  key={clipart.id}
                  className="p-3 bg-gray-800/50 border-gray-700 flex items-center gap-3 hover:border-green-500/50 transition-colors cursor-pointer"
                  onClick={() => handleSelectClipart(clipart)}
                >
                  <div className="w-16 h-16 bg-gray-900 rounded-lg relative flex-shrink-0">
                    {clipart.image_url ? (
                      <NextImage
                        src={clipart.image_url}
                        alt={clipart.name}
                        fill
                        className="object-contain rounded-lg p-1"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white">{clipart.name}</p>
                      {clipart.is_premium && (
                        <Badge className="bg-yellow-500 text-black text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Pro
                        </Badge>
                      )}
                    </div>
                    {clipart.description && (
                      <p className="text-xs text-gray-400 mb-1 line-clamp-1">{clipart.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {clipart.category && (
                        <Badge variant="outline" className="border-gray-600 text-xs">
                          {clipart.category}
                        </Badge>
                      )}
                      {clipart.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="border-gray-600 text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectClipart(clipart);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Utiliser
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(clipart.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-gray-600"
              >
                Précédent
              </Button>
              <span className="text-sm text-gray-400">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-gray-600"
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="p-12 bg-gray-800/30 border-gray-700 border-dashed text-center">
          <Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">
            {searchQuery || selectedCategory !== 'all' ? 'Aucun clipart trouvé' : 'Aucun clipart'}
          </h3>
          <p className="text-sm text-gray-500">
            {searchQuery || selectedCategory !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : showUploadButton
              ? 'Commencez par uploader votre premier clipart'
              : 'Aucun clipart disponible'}
          </p>
        </Card>
      )}
    </div>
  );
}

const ClipartBrowserMemo = memo(ClipartBrowser);

export default function ClipartBrowserWithErrorBoundary(props: ClipartBrowserProps) {
  return (
    <ErrorBoundary componentName="ClipartBrowser">
      <ClipartBrowserMemo {...props} />
    </ErrorBoundary>
  );
}
