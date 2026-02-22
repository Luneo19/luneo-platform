/**
 * Hook personnalisé pour les paramètres de sécurité
 */
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { trpc } from '@/lib/trpc/client';

export function useSecuritySettings() {
  const { t } = useI18n();
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
          title: t('common.success'),
          description: t('settings.profile.saved'),
        });
        router.refresh();
        return { success: true };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('Error changing password', { error });
        toast({
          title: t('common.error'),
          description: getErrorDisplayMessage(error),
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [changePasswordMutation, toast, router, t]
  );

  return {
    handleChangePassword,
    isChanging: changePasswordMutation.isPending,
  };
}



