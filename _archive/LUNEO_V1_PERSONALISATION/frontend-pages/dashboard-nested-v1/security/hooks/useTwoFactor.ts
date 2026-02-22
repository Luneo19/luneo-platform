/**
 * Hook personnalisé pour gérer la 2FA
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import type { TwoFactorStatus } from '../types';

export function useTwoFactor() {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<TwoFactorStatus>({ enabled: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = await endpoints.auth.me();
      setStatus({
        enabled: (user as { twoFactorEnabled?: boolean })?.twoFactorEnabled ?? false,
        verified_at: (user as { twoFactorVerifiedAt?: string })?.twoFactorVerifiedAt,
        created_at: (user as { twoFactorCreatedAt?: string })?.twoFactorCreatedAt,
      });
    } catch (error: unknown) {
      logger.error('Error fetching 2FA status', { error });
      toast({
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
      setStatus({ enabled: false });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const enable2FA = useCallback(
    async (token?: string): Promise<{ success: boolean; data?: TwoFactorStatus }> => {
      try {
        setIsEnabling(true);

        if (!token) {
          const data = await endpoints.auth.setup2FA();
          setStatus({
            enabled: false,
            qrCode: data.qrCodeUrl ?? (data as { qrCode?: string }).qrCode,
            backupCodes: data.backupCodes ?? [],
          });
          return { success: true, data: { qrCode: data.qrCodeUrl, backupCodes: data.backupCodes } as TwoFactorStatus };
        }

        await endpoints.auth.verify2FA(token);
        setStatus({ enabled: true });
        toast({ title: t('common.success'), description: t('common.success') });
        router.refresh();
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error enabling 2FA', { error });
        toast({
          title: t('common.error'),
          description: getErrorDisplayMessage(error),
          variant: 'destructive',
        });
        return { success: false };
      } finally {
        setIsEnabling(false);
      }
    },
    [toast, router, t]
  );

  const disable2FA = useCallback(async (): Promise<{ success: boolean }> => {
    try {
      setIsDisabling(true);

      await endpoints.auth.disable2FA();

      setStatus({ enabled: false });
      toast({ title: t('common.success'), description: t('common.success') });
      router.refresh();
      return { success: true };
    } catch (error: unknown) {
      logger.error('Error disabling 2FA', { error });
      toast({
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setIsDisabling(false);
    }
  }, [toast, router, t]);

  return {
    status,
    isLoading,
    isEnabling,
    isDisabling,
    enable2FA,
    disable2FA,
    refetch: fetchStatus,
  };
}



