/**
 * Hook personnalisé pour les paramètres de sécurité
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export function useSecuritySettings() {
  const { t } = useI18n();
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
        toast({ title: t('common.success'), description: t('settings.security.passwordChanged') });
        router.refresh();
        return { success: true };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : t('settings.security.passwordChangeError');
        logger.error('Error changing password', { error });
        toast({
          title: t('common.error'),
          description: message,
          variant: 'destructive',
        });
        return { success: false, error: message };
      } finally {
        setIsChangingPassword(false);
      }
    },
    [toast, router, t]
  );

  return {
    changePassword,
    isChangingPassword,
  };
}



