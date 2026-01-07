/**
 * Hook personnalisé pour gérer la bibliothèque
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/lib/trpc/client';
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
    sortBy,
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
        const response = await fetch(
          isFavorite ? `/api/library/favorites?templateId=${templateId}` : '/api/library/favorites',
          {
            method: isFavorite ? 'DELETE' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: isFavorite ? undefined : JSON.stringify({ templateId }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors de la mise à jour des favoris');
        }

        setTemplates((prev) =>
          prev.map((t) => (t.id === templateId ? { ...t, isFavorite: !isFavorite } : t))
        );

        toast({
          title: 'Succès',
          description: isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris',
        });

        return { success: true };
      } catch (error: any) {
        logger.error('Error toggling favorite', { error });
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de la mise à jour des favoris',
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
        const response = await fetch(`/api/library/templates?id=${templateId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors de la suppression');
        }

        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        toast({ title: 'Succès', description: 'Template supprimé' });
        router.refresh();
        return { success: true };
      } catch (error: any) {
        logger.error('Error deleting template', { error });
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de la suppression',
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


