/**
 * Hook personnalisé pour les paramètres de profil
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc/client';
import type { UserProfile } from '../types';

export function useProfileSettings() {
  const router = useRouter();
  const { toast } = useToast();

  const updateMutation = trpc.profile.update.useMutation();

  const handleUpdateProfile = useCallback(
    async (profile: Partial<UserProfile>): Promise<{ success: boolean }> => {
      try {
        await updateMutation.mutateAsync({
          name: profile.name,
          phone: profile.phone,
          company: profile.company,
          website: profile.website,
          timezone: profile.timezone,
        });
        toast({
          title: 'Succès',
          description: 'Profil mis à jour avec succès',
        });
        router.refresh();
        return { success: true };
      } catch (error: any) {
        logger.error('Error updating profile', { error });
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de la mise à jour',
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [updateMutation, toast, router]
  );

  return {
    handleUpdateProfile,
    isUpdating: updateMutation.isPending,
  };
}


