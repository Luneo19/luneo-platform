/**
 * useMarketplace Hook
 * MK-001 à MK-015: Hook pour le marketplace de templates
 */

'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';
import type {
  Template,
  TemplateCategory,
  Review,
  CreatorProfile,
  Collection,
  MarketplaceFilters,
  PaginatedResponse,
} from './types';

interface UseMarketplaceState {
  templates: Template[];
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  hasMore: boolean;
}

export function useMarketplace() {
  const [state, setState] = useState<UseMarketplaceState>({
    templates: [],
    isLoading: false,
    error: null,
    total: 0,
    page: 1,
    hasMore: false,
  });

  /**
   * Search templates
   */
  const searchTemplates = useCallback(async (
    filters: MarketplaceFilters = {},
    page: number = 1,
    pageSize: number = 12
  ): Promise<PaginatedResponse<Template>> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (filters.query) params.set('query', filters.query);
      if (filters.category) params.set('category', filters.category);
      if (filters.tags?.length) params.set('tags', filters.tags.join(','));
      if (filters.priceRange) {
        params.set('minPrice', filters.priceRange.min.toString());
        params.set('maxPrice', filters.priceRange.max.toString());
      }
      if (filters.rating) params.set('rating', filters.rating.toString());
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.freeOnly) params.set('freeOnly', 'true');
      if (filters.creatorId) params.set('creatorId', filters.creatorId);

      const data = await api.get<{ items?: Template[]; total?: number; page?: number; hasMore?: boolean }>(
        '/api/v1/marketplace/templates',
        { params: Object.fromEntries(params) }
      );

      const items = data?.items ?? [];
      setState((prev) => ({
        ...prev,
        templates: page === 1 ? items : [...prev.templates, ...items],
        total: data?.total ?? 0,
        page: data?.page ?? page,
        hasMore: data?.hasMore ?? false,
        isLoading: false,
      }));

      return {
        items,
        total: data?.total ?? 0,
        page: data?.page ?? page,
        pageSize,
        hasMore: data?.hasMore ?? false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      logger.error('Failed to search templates', { error });
      return { items: [], total: 0, page: 1, pageSize, hasMore: false };
    }
  }, []);

  /**
   * Get template by ID or slug
   */
  const getTemplate = useCallback(async (idOrSlug: string): Promise<Template | null> => {
    try {
      return await api.get<Template>(`/api/v1/marketplace/templates/${idOrSlug}`);
    } catch (error) {
      logger.error('Failed to get template', { error, idOrSlug });
      return null;
    }
  }, []);

  /**
   * Get featured templates
   */
  const getFeaturedTemplates = useCallback(async (limit: number = 8): Promise<Template[]> => {
    try {
      const data = await api.get<{ items?: Template[] }>('/api/v1/marketplace/templates/featured', {
        params: { limit },
      });
      return data?.items ?? [];
    } catch (error) {
      logger.error('Failed to get featured templates', { error });
      return [];
    }
  }, []);

  /**
   * Get template reviews
   */
  const getReviews = useCallback(async (
    templateId: string,
    page: number = 1
  ): Promise<PaginatedResponse<Review>> => {
    try {
      return await api.get<PaginatedResponse<Review>>(
        `/api/v1/marketplace/templates/${templateId}/reviews`,
        { params: { page } }
      );
    } catch (error) {
      logger.error('Failed to get reviews', { error, templateId });
      return { items: [], total: 0, page: 1, pageSize: 10, hasMore: false };
    }
  }, []);

  /**
   * Add review
   */
  const addReview = useCallback(async (
    templateId: string,
    rating: number,
    title: string,
    content: string
  ): Promise<Review | null> => {
    try {
      return await api.post<Review>(`/api/v1/marketplace/templates/${templateId}/reviews`, {
        rating,
        title,
        content,
      });
    } catch (error) {
      logger.error('Failed to add review', { error, templateId });
      return null;
    }
  }, []);

  /**
   * Get creator profile
   */
  const getCreator = useCallback(async (username: string): Promise<CreatorProfile | null> => {
    try {
      return await api.get<CreatorProfile>(`/api/v1/marketplace/creators/${username}`);
    } catch (error) {
      logger.error('Failed to get creator', { error, username });
      return null;
    }
  }, []);

  /**
   * Purchase template
   */
  const purchaseTemplate = useCallback(async (
    templateId: string
  ): Promise<{ checkoutUrl: string } | null> => {
    try {
      return await api.post<{ checkoutUrl: string }>(
        `/api/v1/marketplace/templates/${templateId}/purchase`
      );
    } catch (error) {
      logger.error('Failed to purchase template', { error, templateId });
      return null;
    }
  }, []);

  /**
   * Download template (after purchase or if free)
   */
  const downloadTemplate = useCallback(async (templateId: string): Promise<string | null> => {
    try {
      const data = await api.get<{ downloadUrl?: string }>(
        `/api/v1/marketplace/templates/${templateId}/download`
      );
      return data?.downloadUrl ?? null;
    } catch (error) {
      logger.error('Failed to download template', { error, templateId });
      return null;
    }
  }, []);

  /**
   * Like template
   */
  const likeTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    try {
      await api.post(`/api/v1/marketplace/templates/${templateId}/like`);
      return true;
    } catch (error) {
      logger.error('Failed to like template', { error, templateId });
      return false;
    }
  }, []);

  /**
   * Follow creator
   */
  const followCreator = useCallback(async (creatorId: string): Promise<boolean> => {
    try {
      await api.post(`/api/v1/marketplace/creators/${creatorId}/follow`);
      return true;
    } catch (error) {
      logger.error('Failed to follow creator', { error, creatorId });
      return false;
    }
  }, []);

  /**
   * Get collections
   */
  const getCollections = useCallback(async (featured: boolean = false): Promise<Collection[]> => {
    try {
      const data = await api.get<{ items?: Collection[] }>('/api/v1/marketplace/collections', {
        params: featured ? { featured: true } : undefined,
      });
      return data?.items ?? [];
    } catch (error) {
      logger.error('Failed to get collections', { error });
      return [];
    }
  }, []);

  /**
   * Load more templates
   */
  const loadMore = useCallback(async (filters: MarketplaceFilters = {}) => {
    if (state.isLoading || !state.hasMore) return;
    await searchTemplates(filters, state.page + 1);
  }, [state.isLoading, state.hasMore, state.page, searchTemplates]);

  /**
   * Clear templates
   */
  const clearTemplates = useCallback(() => {
    setState({
      templates: [],
      isLoading: false,
      error: null,
      total: 0,
      page: 1,
      hasMore: false,
    });
  }, []);

  return {
    // State
    templates: state.templates,
    isLoading: state.isLoading,
    error: state.error,
    total: state.total,
    page: state.page,
    hasMore: state.hasMore,

    // Actions
    searchTemplates,
    getTemplate,
    getFeaturedTemplates,
    getReviews,
    addReview,
    getCreator,
    purchaseTemplate,
    downloadTemplate,
    likeTemplate,
    followCreator,
    getCollections,
    loadMore,
    clearTemplates,
  };
}

export default useMarketplace;


