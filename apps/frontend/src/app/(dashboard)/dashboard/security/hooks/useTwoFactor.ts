/**
 * Hook personnalisé pour gérer la 2FA
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
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
      const response = await fetch('/api/settings/2fa');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la récupération du statut 2FA');
      }

      setStatus({
        enabled: data.data?.enabled || false,
        verified_at: data.data?.verified_at,
        created_at: data.data?.created_at,
      });
    } catch (error: any) {
      logger.error('Error fetching 2FA status', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la récupération du statut 2FA',
        variant: 'destructive',
      });
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

        const response = await fetch('/api/settings/2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'enable',
            token,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors de l\'activation de la 2FA');
        }

        if (data.data?.qrCode) {
          // Première étape : génération du QR code
          setStatus({
            enabled: false,
            qrCode: data.data.qrCode,
            backupCodes: data.data.backupCodes,
          });
          return { success: true, data: data.data };
        } else {
          // Deuxième étape : activation confirmée
          setStatus({ enabled: true });
          toast({ title: 'Succès', description: '2FA activée avec succès' });
          router.refresh();
          return { success: true };
        }
      } catch (error: any) {
        logger.error('Error enabling 2FA', { error });
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de l\'activation de la 2FA',
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

      const response = await fetch('/api/settings/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disable',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la désactivation de la 2FA');
      }

      setStatus({ enabled: false });
      toast({ title: 'Succès', description: '2FA désactivée avec succès' });
      router.refresh();
      return { success: true };
    } catch (error: any) {
      logger.error('Error disabling 2FA', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la désactivation de la 2FA',
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


