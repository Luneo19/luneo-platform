import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/dashboard/notifications
 * Récupère les notifications de l'utilisateur
 * Query params: limit? (nombre de notifications)
 * Forward vers backend NestJS: GET /api/v1/notifications
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    try {
      // Essayer de récupérer depuis le backend
      const result = await forwardGet('/notifications', request, {
        limit,
        unreadOnly: false, // Récupérer toutes les notifications (lues et non lues)
      });

      // Transformer les notifications du backend en format frontend
      // Le backend retourne { notifications: [...], pagination: {...} }
      const backendNotifications = result.data?.notifications || result.notifications || [];
      
      const notifications = backendNotifications.map((notif: any) => ({
        id: notif.id || notif.notificationId,
        type: (notif.type || notif.category || 'info') as 'success' | 'info' | 'warning' | 'error',
        title: notif.title || notif.subject || 'Notification',
        message: notif.message || notif.body || '',
        time: formatTimeAgo(notif.createdAt || notif.timestamp || notif.created_at),
        read: notif.read || notif.isRead || false,
      }));

      return { notifications };
    } catch (error) {
      // Si le backend n'a pas d'endpoint notifications, retourner un tableau vide
      // plutôt que des données mockées
      return { notifications: [] };
    }
  }, '/api/dashboard/notifications', 'GET');
}

/**
 * Helper pour formater le temps relatif (il y a X min/h/j)
 */
function formatTimeAgo(date: string | Date): string {
  if (!date) return 'Récemment';
  
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return then.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
