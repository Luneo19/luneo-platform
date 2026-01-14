'use client';

/**
 * Template Gallery - Professional Template Library
 * Complete implementation with search, filters, categories, and preview
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import NextImage from 'next/image';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Search,
  Filter,
  Grid3x3,
  List,
  Eye,
  Download,
  Star,
  Tag,
  Layers,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  preview_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  is_published?: boolean;
  is_featured?: boolean;
  views_count?: number;
  uses_count?: number;
  created_at: string;
  updated_at?: string;
}

interface TemplateGalleryProps {
  className?: string;
  onTemplateSelect?: (template: Template) => void;
  showCreateButton?: boolean;
}

function TemplateGallery({ className, onTemplateSelect, showCreateButton = true }: TemplateGalleryProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'uses_count' | 'views_count'>('created_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadTemplates();
  }, [page, sortBy, selectedCategory]);

  // Optimisé: useMemo pour filtrage au lieu de useEffect
  const filteredTemplates = useMemo(() => {
    let filtered = [...templates];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    return filtered;
  }, [searchQuery, templates, selectedCategory]);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '24',
        sort_by: sortBy,
        sort_order: 'desc',
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/templates?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
        setTotalPages(data.pagination?.totalPages || 1);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set((data.templates || []).map((t: Template) => t.category).filter(Boolean))
        ) as string[];
        setCategories(uniqueCategories);
      } else {
        throw new Error('Failed to load templates');
      }
    } catch (error) {
      logger.error('Failed to load templates', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les templates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, selectedCategory, toast]);

  const handleUseTemplate = (template: Template) => {
    onTemplateSelect?.(template);
    toast({
      title: 'Template sélectionné',
      description: `Template "${template.name}" prêt à être utilisé`,
    });
  };

  const handlePreview = (template: Template) => {
    if (template.preview_url || template.thumbnail_url) {
      window.open(template.preview_url || template.thumbnail_url, '_blank');
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-400" />
            Bibliothèque de Templates
          </h2>
          <p className="text-gray-400">
            {templates.length} template{templates.length > 1 ? 's' : ''} disponible{templates.length > 1 ? 's' : ''}
          </p>
        </div>
        {showCreateButton && (
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Sparkles className="w-4 h-4 mr-2" />
            Créer un template
          </Button>
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
              placeholder="Rechercher un template..."
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
              <SelectItem value="uses_count">Plus utilisés</SelectItem>
              <SelectItem value="views_count">Plus vus</SelectItem>
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

      {/* Templates Grid/List */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Chargement des templates...</p>
        </Card>
      ) : filteredTemplates.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredTemplates.map((template, i) => (
                  <motion
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden bg-gray-800/50 border-gray-700 group hover:border-purple-500/50 transition-colors">
                      <div className="aspect-square bg-gray-900 relative">
                        {template.thumbnail_url || template.preview_url ? (
                          <NextImage
                            src={template.thumbnail_url || template.preview_url || ''}
                            alt={template.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Layers className="w-16 h-16 text-gray-600" />
                          </div>
                        )}
                        {template.is_featured && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-yellow-500 text-black">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handlePreview(template)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUseTemplate(template)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Utiliser
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-white mb-1 line-clamp-1">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">{template.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            {template.category && (
                              <Badge variant="outline" className="border-gray-600 text-xs">
                                {template.category}
                              </Badge>
                            )}
                            {template.tags?.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="border-gray-600 text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          {template.uses_count !== undefined && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {template.uses_count}
                            </span>
                          )}
                          {template.views_count !== undefined && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {template.views_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="p-4 bg-gray-800/50 border-gray-700 flex items-center gap-4 hover:border-purple-500/50 transition-colors"
                >
                  <div className="w-24 h-24 bg-gray-900 rounded-lg relative flex-shrink-0">
                    {template.thumbnail_url || template.preview_url ? (
                      <NextImage
                        src={template.thumbnail_url || template.preview_url || ''}
                        alt={template.name}
                        fill
                        className="object-cover rounded-lg"
                        sizes="96px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layers className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{template.name}</h3>
                      {template.is_featured && (
                        <Badge className="bg-yellow-500 text-black text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-400 mb-2 line-clamp-1">{template.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {template.category && (
                        <Badge variant="outline" className="border-gray-600 text-xs">
                          {template.category}
                        </Badge>
                      )}
                      {template.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="border-gray-600 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handlePreview(template)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={() => handleUseTemplate(template)} className="bg-purple-600 hover:bg-purple-700">
                      Utiliser
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
            {searchQuery || selectedCategory !== 'all' ? 'Aucun template trouvé' : 'Aucun template'}
          </h3>
          <p className="text-sm text-gray-500">
            {searchQuery || selectedCategory !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Commencez par créer votre premier template'}
          </p>
        </Card>
      )}
    </div>
  );
}

const TemplateGalleryMemo = memo(TemplateGallery);

export default function TemplateGalleryWithErrorBoundary(props: TemplateGalleryProps) {
  return (
    <ErrorBoundary componentName="TemplateGallery">
      <TemplateGalleryMemo {...props} />
    </ErrorBoundary>
  );
}
