/**
 * Hook personnalisé pour les paramètres de sécurité
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export function useSecuritySettings() {
  const router = useRouter();
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsChangingPassword(true);

        const response = await fetch('/api/settings/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: newPassword,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors du changement de mot de passe');
        }

        toast({ title: 'Succès', description: 'Mot de passe mis à jour avec succès' });
        router.refresh();
        return { success: true };
      } catch (error: any) {
        logger.error('Error changing password', { error });
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors du changement de mot de passe',
          variant: 'destructive',
        });
        return { success: false, error: error.message };
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



