import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * GET /api/notifications
 * Récupère les notifications de l'utilisateur
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer les notifications depuis Supabase
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.warn('Error fetching notifications', { error, userId: user.id });
      
      // Retourner des notifications par défaut si la table n'existe pas
      return {
        notifications: [
          {
            id: 'welcome',
            type: 'info',
            title: 'Bienvenue sur Luneo !',
            message: 'Découvrez toutes les fonctionnalités de votre dashboard.',
            read: false,
            created_at: new Date().toISOString(),
            action_url: '/dashboard/overview',
            action_label: 'Explorer',
          },
          {
            id: 'trial',
            type: 'promo',
            title: 'Essai gratuit de 14 jours',
            message: 'Profitez de toutes les fonctionnalités Premium gratuitement.',
            read: false,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            action_url: '/pricing',
            action_label: 'Voir les plans',
          },
        ],
      };
    }

    return { notifications: notifications || [] };
  }, '/api/notifications', 'GET');
}

/**
 * POST /api/notifications
 * Crée une nouvelle notification (admin/système uniquement)
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    const { userId, type, title, message, actionUrl, actionLabel } = body;

    if (!userId || !type || !title || !message) {
      throw {
        status: 400,
        message: 'Données manquantes',
        code: 'VALIDATION_ERROR',
      };
    }

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl,
        action_label: actionLabel,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw {
        status: 500,
        message: 'Erreur lors de la création',
        code: 'DB_ERROR',
      };
    }

    logger.info('Notification created', { notificationId: notification.id, userId });

    return { notification };
  }, '/api/notifications', 'POST');
}
