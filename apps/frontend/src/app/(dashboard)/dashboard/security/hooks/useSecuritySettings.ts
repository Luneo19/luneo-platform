/**
 * Hook personnalisé pour les paramètres de sécurité
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export function useSecuritySettings() {
  const router = useRouter();
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsChangingPassword(true);
        await api.put('/api/v1/auth/change-password', {
          currentPassword,
          newPassword,
        });
        toast({ title: 'Succès', description: 'Mot de passe mis à jour avec succès' });
        router.refresh();
        return { success: true };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe';
        logger.error('Error changing password', { error });
        toast({
          title: 'Erreur',
          description: message,
          variant: 'destructive',
        });
        return { success: false, error: message };
      } finally {
        setIsChangingPassword(false);
      }
    },
    [toast, router]
  );

  return {
    changePassword,
    isChangingPassword,
  };
}



