/**
 * useMarketplace Hook
 * MK-001 à MK-015: Hook pour le marketplace de templates
 */

'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
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

      const response = await fetch(`/api/marketplace/templates?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        templates: page === 1 ? data.items : [...prev.templates, ...data.items],
        total: data.total,
        page: data.page,
        hasMore: data.hasMore,
        isLoading: false,
      }));

      return data;
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
      const response = await fetch(`/api/marketplace/templates/${idOrSlug}`);
      
      if (!response.ok) {
        throw new Error('Template not found');
      }

      return await response.json();
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
      const response = await fetch(`/api/marketplace/templates/featured?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch featured templates');
      }

      const data = await response.json();
      return data.items || [];
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
      const response = await fetch(
        `/api/marketplace/templates/${templateId}/reviews?page=${page}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      return await response.json();
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
      const response = await fetch(`/api/marketplace/templates/${templateId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, title, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to add review');
      }

      return await response.json();
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
      const response = await fetch(`/api/marketplace/creators/${username}`);
      
      if (!response.ok) {
        throw new Error('Creator not found');
      }

      return await response.json();
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
      const response = await fetch(`/api/marketplace/templates/${templateId}/purchase`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to initiate purchase');
      }

      return await response.json();
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
      const response = await fetch(`/api/marketplace/templates/${templateId}/download`);

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const data = await response.json();
      return data.downloadUrl;
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
      const response = await fetch(`/api/marketplace/templates/${templateId}/like`, {
        method: 'POST',
      });

      return response.ok;
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
      const response = await fetch(`/api/marketplace/creators/${creatorId}/follow`, {
        method: 'POST',
      });

      return response.ok;
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
      const params = featured ? '?featured=true' : '';
      const response = await fetch(`/api/marketplace/collections${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch collections');
      }

      const data = await response.json();
      return data.items || [];
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


