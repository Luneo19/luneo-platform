/**
 * Hook personnalisé pour gérer la bibliothèque
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/lib/hooks/useAuth';
import { trpc } from '@/lib/trpc/client';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Template, TemplateCategory, SortOption } from '../types';

interface FavoriteRecord {
  id: string;
  resourceId: string;
  resourceType: string;
}

export function useLibrary(
  page: number,
  categoryFilter: string,
  searchTerm: string,
  sortBy: SortOption
) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const { data: user } = useCurrentUser();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const templatesQuery = trpc.library.listTemplates.useQuery({
    page,
    limit: 12,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: searchTerm || undefined,
    sortBy: sortBy === 'size' ? 'name' : sortBy,
  });

  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const fetchFavorites = useCallback(() => {
    if (!user?.id) {
      setFavorites([]);
      return;
    }
    api
      .get<{ favorites?: FavoriteRecord[] }>('/api/v1/library/favorites', {
        params: { type: 'template' },
      })
      .then((res) => setFavorites(res?.favorites ?? []))
      .catch(() => setFavorites([]));
  }, [user?.id]);
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  useEffect(() => {
    if (templatesQuery.data) {
      const favoriteByResource = new Map(
        favorites.map((f) => [f.resourceId, f])
      );
      const formattedTemplates: Template[] = templatesQuery.data.templates.map((template: Record<string, unknown>) => {
        const fav = favoriteByResource.get(template.id as string);
        return {
          id: template.id as string,
          name: template.name as string,
          description: template.description as string,
          category: (template.category as string) as TemplateCategory,
          thumbnail: template.thumbnail as string,
          isPremium: template.isPremium as boolean,
          isFavorite: !!fav,
          favoriteId: fav?.id,
          downloads: template.downloads as number,
          views: template.views as number,
          rating: template.rating as number,
          createdAt: template.createdAt as string,
          updatedAt: template.updatedAt as string,
          tags: (template.tags as string[]) || [],
          size: typeof template.size === 'number' ? template.size : Number(template.size) || undefined,
          format: template.format as string,
          author: template.author as string,
          version: typeof template.version === 'number' ? template.version : undefined,
          collectionId: typeof template.collectionId === 'string' ? template.collectionId : undefined,
          metadata: template.metadata as Template['metadata'],
        };
      });

      if (page === 1) {
        setTemplates(formattedTemplates);
      } else {
        setTemplates((prev) => [...prev, ...formattedTemplates]);
      }

      setHasMore(templatesQuery.data.pagination.hasNext);
    }
  }, [templatesQuery.data, page, favorites]);

  const toggleFavorite = useCallback(
    async (
      templateId: string,
      isFavorite: boolean,
      favoriteId?: string
    ): Promise<{ success: boolean }> => {
      try {
        if (isFavorite) {
          if (!favoriteId) {
            logger.error('Cannot remove favorite: missing favoriteId');
            return { success: false };
          }
          await api.delete(`/api/v1/library/favorites/${favoriteId}`);
        } else {
          await api.post('/api/v1/library/favorites', {
            resourceId: templateId,
            resourceType: 'template',
          });
        }

        setTemplates((prev) =>
          prev.map((t) => (t.id === templateId ? { ...t, isFavorite: !isFavorite } : t))
        );
        fetchFavorites();

        toast({
          title: t('common.success'),
          description: isFavorite ? t('library.unfavorite') : t('library.addToFavorites'),
        });

        return { success: true };
      } catch (error: unknown) {
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || t('common.somethingWentWrong');
        logger.error('Error toggling favorite', { error });
        toast({
          title: t('common.error'),
          description: message,
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [toast, fetchFavorites, t]
  );

  const deleteTemplate = useCallback(
    async (templateId: string): Promise<{ success: boolean }> => {
      try {
        await api.delete(`/api/v1/marketplace/${templateId}`);

        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        toast({ title: t('common.success'), description: t('common.success') });
        router.refresh();
        return { success: true };
      } catch (error: unknown) {
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || t('common.somethingWentWrong');
        logger.error('Error deleting template', { error });
        toast({
          title: t('common.error'),
          description: message,
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [toast, router, t]
  );

  return {
    templates,
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    hasMore,
    refetch: templatesQuery.refetch,
    toggleFavorite,
    deleteTemplate,
  };
}



