/**
 * Hook personnalisé pour gérer les générations AI
 */

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc/client';
import type { Generation, GenerationType, GenerationStatus } from '../types';

export function useAIGenerations(
  type: GenerationType,
  searchTerm: string,
  filterStatus: string
) {
  const { toast } = useToast();
  const [generations, setGenerations] = useState<Generation[]>([]);

  // Use listGenerated instead of listGenerations
  const generationsQuery = trpc.ai.listGenerated.useQuery({
    page: 1,
    limit: 50,
  });

  useEffect(() => {
    if (generationsQuery.data?.designs) {
      const transformed: Generation[] = (generationsQuery.data.designs as any[]).map((g) => ({
        id: g.id,
        type: type, // Use active tab type
        prompt: g.prompt || g.name || '',
        status: 'completed' as GenerationStatus, // Assume completed for existing designs
        result: g.url || '',
        thumbnail: g.url || '',
        createdAt: g.createdAt ? new Date(g.createdAt) : new Date(),
        credits: 10, // Default credits
        model: g.style === 'photorealistic' ? 'dall-e-3' : 'midjourney',
        parameters: { style: g.style },
        revisedPrompt: undefined,
      }));
      setGenerations(transformed);
    }
  }, [generationsQuery.data, type]);

  const filteredGenerations = useMemo(() => {
    return generations.filter((gen) => {
      const matchesSearch =
        searchTerm === '' ||
        gen.prompt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || gen.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [generations, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: generations.length,
      completed: generations.filter((g) => g.status === 'completed').length,
      processing: generations.filter((g) => g.status === 'processing').length,
      failed: generations.filter((g) => g.status === 'failed').length,
      totalCredits: generations.reduce((sum, g) => sum + g.credits, 0),
    };
  }, [generations]);

  const handleDelete = async (generationId: string) => {
    try {
      await api.delete(`/api/v1/ai-studio/generations/${generationId}`);
      toast({ title: 'Succès', description: 'Génération supprimée' });
      generationsQuery.refetch();
    } catch (error: any) {
      logger.error('Error deleting generation', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    }
  };

  return {
    generations: filteredGenerations,
    allGenerations: generations,
    stats,
    isLoading: generationsQuery.isLoading,
    error: generationsQuery.error,
    refetch: generationsQuery.refetch,
    deleteGeneration: handleDelete,
    isDeleting: false,
  };
}
