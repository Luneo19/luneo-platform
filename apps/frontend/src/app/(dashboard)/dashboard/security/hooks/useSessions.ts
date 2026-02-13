/**
 * Hook personnalisé pour gérer les sessions
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import type { SecuritySession } from '../types';

export function useSessions() {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SecuritySession[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<{ sessions?: Array<Record<string, unknown>> }>('/api/v1/users/me/sessions');
      const list = data?.sessions ?? [];
      const deviceTypes = ['desktop', 'mobile', 'tablet', 'other'] as const;
      const mapDeviceType = (d: string): (typeof deviceTypes)[number] =>
        deviceTypes.includes(d as (typeof deviceTypes)[number]) ? (d as (typeof deviceTypes)[number]) : 'other';
      setSessions(
        list.map((s: Record<string, unknown>) => ({
          id: (s.id as string) || 'unknown',
          device: (s.device as string) || 'Unknown Device',
          deviceType: mapDeviceType((s.device_type as string) || 'other'),
          browser: (s.browser as string) || 'Unknown',
          os: (s.os as string) || 'Unknown',
          location: (s.location as string) || 'Unknown',
          ipAddress: (s.ip_address as string) ?? (s.ipAddress as string),
          lastActive: s.last_active ? new Date(s.last_active as string) : new Date(),
          isCurrent: (s.is_current as boolean) ?? false,
          isTrusted: (s.is_trusted as boolean) !== false,
          fingerprint: s.fingerprint as string | undefined,
          user_agent: s.user_agent as string | undefined,
          created_at: s.created_at as string | undefined,
          expires_at: s.expires_at as string | undefined,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load sessions'));
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const revokeSession = useCallback(
    async (sessionId: string): Promise<{ success: boolean }> => {
      try {
        await api.delete(`/api/v1/users/me/sessions/${sessionId}`);
        toast({ title: t('common.success'), description: t('common.success') });
        router.refresh();
        fetchSessions();
        return { success: true };
      } catch (error: unknown) {
        logger.error('Error revoking session', { error });
        toast({
          title: t('common.error'),
          description: getErrorDisplayMessage(error),
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [toast, router, fetchSessions, t]
  );

  const revokeAllSessions = useCallback(async (): Promise<{ success: boolean }> => {
    try {
      await api.delete('/api/v1/users/me/sessions?all=true');
      toast({ title: t('common.success'), description: t('common.success') });
      router.refresh();
      fetchSessions();
      return { success: true };
    } catch (error: unknown) {
      logger.error('Error revoking all sessions', { error });
      toast({
        title: t('common.error'),
          description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
      return { success: false };
    }
  }, [toast, router, fetchSessions, t]);

  return {
    sessions,
    isLoading,
    error,
    revokeSession,
    revokeAllSessions,
    refetch: fetchSessions,
  };
}



