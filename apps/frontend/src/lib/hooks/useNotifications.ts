'use client';

import { useState, useEffect, useCallback } from 'react';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function useNotifications(limit: number = 10) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await endpoints.notifications.list({ limit });
      
      // Gérer le format ApiResponseBuilder
      interface NotificationsListResult { success?: boolean; data?: { notifications?: unknown[] }; notifications?: unknown[] }
      const data = (result as NotificationsListResult).success === true ? (result as NotificationsListResult).data : result;
      
      const list = data?.notifications && Array.isArray(data.notifications) ? data.notifications : [];
      setNotifications(
        (list as Record<string, unknown>[]).map((n) => ({
          id: String(n.id ?? ''),
          type: (n.type as Notification['type']) ?? 'info',
          title: String(n.title ?? ''),
          message: String(n.message ?? ''),
          time: n.created_at ? new Date(n.created_at as string).toLocaleString('fr-FR') : String(n.time ?? ''),
          read: Boolean(n.is_read ?? n.read),
        }))
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('Erreur chargement notifications', {
        error: err,
        limit,
        message: errorMessage,
      });
      setError(errorMessage);
      // En cas d'erreur, retourner un tableau vide plutôt que des données mockées
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    loading,
    error,
    refresh: loadNotifications,
  };
}
