/**
 * Hook personnalisé pour gérer la bibliothèque
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/lib/trpc/client';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Template, SortOption } from '../types';

export function useLibrary(
  page: number,
  categoryFilter: string,
  searchTerm: string,
  sortBy: SortOption
) {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const templatesQuery = trpc.library.listTemplates.useQuery({
    page,
    limit: 12,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: searchTerm || undefined,
    sortBy: sortBy === 'size' ? 'name' : sortBy,
  });

  useEffect(() => {
    if (templatesQuery.data) {
      const formattedTemplates: Template[] = templatesQuery.data.templates.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        thumbnail: template.thumbnail,
        isPremium: template.isPremium,
        isFavorite: template.isFavorite,
        downloads: template.downloads,
        views: template.views,
        rating: template.rating,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        tags: template.tags || [],
        size: template.size,
        format: template.format,
        author: template.author,
        version: template.version,
        collectionId: template.collectionId,
        metadata: template.metadata,
      }));

      if (page === 1) {
        setTemplates(formattedTemplates);
      } else {
        setTemplates((prev) => [...prev, ...formattedTemplates]);
      }

      setHasMore(templatesQuery.data.pagination.hasNext);
    }
  }, [templatesQuery.data, page]);

  const toggleFavorite = useCallback(
    async (templateId: string, isFavorite: boolean): Promise<{ success: boolean }> => {
      try {
        if (isFavorite) {
          await api.delete('/api/v1/library/favorites', { params: { templateId } });
        } else {
          await api.post('/api/v1/library/favorites', { templateId });
        }

        setTemplates((prev) =>
          prev.map((t) => (t.id === templateId ? { ...t, isFavorite: !isFavorite } : t))
        );

        toast({
          title: 'Succès',
          description: isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris',
        });

        return { success: true };
      } catch (error: unknown) {
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || 'Erreur lors de la mise à jour des favoris';
        logger.error('Error toggling favorite', { error });
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [toast]
  );

  const deleteTemplate = useCallback(
    async (templateId: string): Promise<{ success: boolean }> => {
      try {
        await api.delete('/api/v1/library/templates', { params: { id: templateId } });

        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        toast({ title: 'Succès', description: 'Template supprimé' });
        router.refresh();
        return { success: true };
      } catch (error: unknown) {
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || 'Erreur lors de la suppression';
        logger.error('Error deleting template', { error });
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [toast, router]
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



