/**
 * Hook personnalisé pour gérer les templates AI
 */

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { AITemplate, TemplateCategory, ViewMode } from '../types';

export function useAITemplates() {
  const [templates, setTemplates] = useState<AITemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'free' | 'premium'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating' | 'downloads' | 'name'>('popular');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await api.get<{ data?: unknown[]; templates?: unknown[] }>('/api/v1/ai-studio/templates');
      const raw = (data?.data ?? data?.templates ?? []) as Record<string, unknown>[];
      const transformed: AITemplate[] = raw.map((t) => ({
        id: t.id as string,
        name: (t.name as string) || 'Template sans nom',
        description: (t.description as string) || '',
        category: ((t.category as string) || 'other') as TemplateCategory,
        type: ((t.type as string) || 'free') as 'free' | 'premium',
        thumbnail: (t.thumbnail as string) || (t.thumbnailUrl as string) || '/placeholder-template.svg',
        preview: (t.preview as string) || (t.previewUrl as string),
        price: t.price as number | undefined,
        rating: (t.rating as number) || 0,
        reviewsCount: (t.reviewsCount as number) || 0,
        downloads: (t.downloads as number) || 0,
        views: (t.views as number) || 0,
        tags: (t.tags as string[]) || [],
        createdAt: t.createdAt ? new Date(t.createdAt as string) : new Date(),
        updatedAt: t.updatedAt ? new Date(t.updatedAt as string) : new Date(),
        author: t.author as string | undefined,
        isFavorite: (t.isFavorite as boolean) || false,
      }));
      setTemplates(transformed);
    } catch (error) {
      logger.error('Failed to fetch templates', { error });
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedTemplates = useMemo(() => {
    const filtered = templates.filter((template) => {
      const matchesSearch =
        searchTerm === '' ||
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesType = selectedType === 'all' || template.type === selectedType;
      return matchesSearch && matchesCategory && matchesType;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads;
        case 'recent':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, searchTerm, selectedCategory, selectedType, sortBy]);

  const stats = useMemo(() => {
    return {
      total: templates.length,
      free: templates.filter((t) => t.type === 'free').length,
      premium: templates.filter((t) => t.type === 'premium').length,
      totalDownloads: templates.reduce((sum, t) => sum + t.downloads, 0),
      averageRating:
        templates.length > 0
          ? templates.reduce((sum, t) => sum + t.rating, 0) / templates.length
          : 0,
    };
  }, [templates]);

  const toggleFavorite = async (templateId: string) => {
    try {
      await api.post(`/api/v1/ai-studio/templates/${templateId}/favorite`);
      setTemplates((prev) =>
        prev.map((t) => (t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t))
      );
      return { success: true };
    } catch (error) {
      logger.error('Failed to toggle favorite', { error, templateId });
      return { success: false };
    }
  };

  return {
    templates: filteredAndSortedTemplates,
    allTemplates: templates,
    stats,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedType,
    setSelectedType,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    toggleFavorite,
    refetch: fetchTemplates,
  };
}



