/**
 * Hook personnalisé pour gérer les templates AI
 */

import { useState, useEffect, useMemo } from 'react';
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
      // TODO: Replace with actual API call
      const response = await fetch('/api/ai-studio/templates');
      if (response.ok) {
        const data = await response.json();
        const transformed: AITemplate[] = (data.data || data.templates || []).map((t: any) => ({
          id: t.id,
          name: t.name || 'Template sans nom',
          description: t.description || '',
          category: (t.category || 'other') as TemplateCategory,
          type: (t.type || 'free') as 'free' | 'premium',
          thumbnail: t.thumbnail || t.thumbnailUrl || '/placeholder-template.jpg',
          preview: t.preview || t.previewUrl,
          price: t.price,
          rating: t.rating || 0,
          reviewsCount: t.reviewsCount || 0,
          downloads: t.downloads || 0,
          views: t.views || 0,
          tags: t.tags || [],
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
          author: t.author,
          isFavorite: t.isFavorite || false,
        }));
        setTemplates(transformed);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      logger.error('Failed to fetch templates', { error });
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates.filter((template) => {
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
      const response = await fetch(`/api/ai-studio/templates/${templateId}/favorite`, {
        method: 'POST',
      });

      if (response.ok) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t))
        );
        return { success: true };
      }
      return { success: false };
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


