/**
 * Hook personnalisé pour gérer les sessions
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/lib/trpc/client';
import { logger } from '@/lib/logger';
import type { SecuritySession } from '../types';

export function useSessions() {
  const router = useRouter();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SecuritySession[]>([]);

  const sessionsQuery = trpc.profile.getSessions.useQuery(undefined, {
    onSuccess: (data) => {
      setSessions(
        (data.sessions || []).map((s: any) => ({
          id: s.id || 'unknown',
          device: s.device || 'Unknown Device',
          deviceType: s.device_type || 'other',
          browser: s.browser || 'Unknown',
          os: s.os || 'Unknown',
          location: s.location || 'Unknown',
          ipAddress: s.ip_address || s.ipAddress,
          lastActive: s.last_active ? new Date(s.last_active) : new Date(),
          isCurrent: s.is_current || false,
          isTrusted: s.is_trusted !== false,
          fingerprint: s.fingerprint,
          user_agent: s.user_agent,
          created_at: s.created_at,
          expires_at: s.expires_at,
        }))
      );
    },
  });

  const revokeSession = useCallback(
    async (sessionId: string): Promise<{ success: boolean }> => {
      try {
        const response = await fetch(`/api/settings/sessions?session_id=${sessionId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors de la révocation de la session');
        }

        toast({ title: 'Succès', description: 'Session révoquée avec succès' });
        router.refresh();
        sessionsQuery.refetch();
        return { success: true };
      } catch (error: any) {
        logger.error('Error revoking session', { error });
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de la révocation de la session',
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [toast, router, sessionsQuery]
  );

  const revokeAllSessions = useCallback(async (): Promise<{ success: boolean }> => {
    try {
      const response = await fetch('/api/settings/sessions?all=true', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la révocation des sessions');
      }

      toast({ title: 'Succès', description: 'Toutes les sessions ont été révoquées' });
      router.refresh();
      sessionsQuery.refetch();
      return { success: true };
    } catch (error: any) {
      logger.error('Error revoking all sessions', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la révocation des sessions',
        variant: 'destructive',
      });
      return { success: false };
    }
  }, [toast, router, sessionsQuery]);

  return {
    sessions,
    isLoading: sessionsQuery.isLoading,
    error: sessionsQuery.error,
    revokeSession,
    revokeAllSessions,
    refetch: sessionsQuery.refetch,
  };
}



