/**
 * Hook personnalisé pour les paramètres de profil
 */
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { trpc } from '@/lib/trpc/client';
import type { UserProfile } from '../types';

export function useProfileSettings() {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();

  const updateMutation = trpc.profile.update.useMutation();

  const handleUpdateProfile = useCallback(
    async (profile: Partial<UserProfile>): Promise<{ success: boolean }> => {
      try {
        await updateMutation.mutateAsync({
          name: profile.name,
          company: profile.company,
          phone: profile.phone,
          website: profile.website,
          timezone: profile.timezone,
        });
        toast({
          title: t('common.success'),
          description: t('settings.profile.saved'),
        });
        router.refresh();
        return { success: true };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('Error updating profile', { error });
        toast({
          title: t('common.error'),
          description: getErrorDisplayMessage(error),
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [updateMutation, toast, router, t]
  );

  return {
    handleUpdateProfile,
    isUpdating: updateMutation.isPending,
  };
}



