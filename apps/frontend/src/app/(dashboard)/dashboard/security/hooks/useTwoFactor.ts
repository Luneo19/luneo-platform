/**
 * Hook personnalisé pour gérer la 2FA
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { TwoFactorStatus } from '../types';

export function useTwoFactor() {
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
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la récupération du statut 2FA',
        variant: 'destructive',
      });
      setStatus({ enabled: false });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
        toast({ title: 'Succès', description: '2FA activée avec succès' });
        router.refresh();
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error enabling 2FA', { error });
        toast({
          title: 'Erreur',
          description: error instanceof Error ? error.message : "Erreur lors de l'activation de la 2FA",
          variant: 'destructive',
        });
        return { success: false };
      } finally {
        setIsEnabling(false);
      }
    },
    [toast, router]
  );

  const disable2FA = useCallback(async (): Promise<{ success: boolean }> => {
    try {
      setIsDisabling(true);

      await endpoints.auth.disable2FA();

      setStatus({ enabled: false });
      toast({ title: 'Succès', description: '2FA désactivée avec succès' });
      router.refresh();
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur lors de la désactivation de la 2FA";
      logger.error('Error disabling 2FA', { error });
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setIsDisabling(false);
    }
  }, [toast, router]);

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



