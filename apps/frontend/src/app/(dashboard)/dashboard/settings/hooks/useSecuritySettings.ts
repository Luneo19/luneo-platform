/**
 * Hook personnalisé pour les paramètres de sécurité
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc/client';

export function useSecuritySettings() {
  const router = useRouter();
  const { toast } = useToast();

  const changePasswordMutation = trpc.profile.changePassword.useMutation();

  const handleChangePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string
    ): Promise<{ success: boolean }> => {
      try {
        await changePasswordMutation.mutateAsync({
          currentPassword,
          newPassword,
        });
        toast({
          title: 'Succès',
          description: 'Mot de passe modifié avec succès',
        });
        router.refresh();
        return { success: true };
      } catch (error: any) {
        logger.error('Error changing password', { error });
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors du changement de mot de passe',
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [changePasswordMutation, toast, router]
  );

  return {
    handleChangePassword,
    isChanging: changePasswordMutation.isPending,
  };
}



