import { useState, useEffect, useCallback } from 'react';
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

      const response = await fetch(`/api/dashboard/notifications?limit=${limit}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Gérer le format ApiResponseBuilder
      const data = result.success === true ? result.data : result;
      
      if (data?.notifications && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      } else {
        // Si pas de notifications, retourner un tableau vide
        setNotifications([]);
      }
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
