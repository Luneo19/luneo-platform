import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest, getPaginationParams, validateWithZodSchema } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createNotificationSchema, updateNotificationSchema } from '@/lib/validation/zod-schemas';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { apiRateLimit } from '@/lib/rate-limit';
import { cacheService, cacheKeys, cacheTTL } from '@/lib/cache/redis';

/**
 * GET /api/notifications
 * Récupère les notifications de l'utilisateur
 */
export async function GET(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id);
    const rateLimitResult = await checkRateLimit(identifier, apiRateLimit);
    
    if (!rateLimitResult.success) {
      throw {
        status: 429,
        message: 'Trop de requêtes. Veuillez réessayer plus tard.',
        code: 'RATE_LIMIT_EXCEEDED',
      };
    }

    const { searchParams } = new URL(request.url);
    const { limit } = getPaginationParams(searchParams);
    const unreadOnly = searchParams.get('unread_only') === 'true';

    // Cache check
    const cacheKey = cacheKeys.notifications(user.id, unreadOnly);
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      logger.info('Notifications served from cache', { userId: user.id, unreadOnly });
      return cached;
    }

    // Construire la requête
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error: dbError } = await query;

    if (dbError) {
      logger.dbError('fetch notifications', dbError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération des notifications' };
    }

    // Compter les non lues
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .eq('is_archived', false);

    const result = {
      notifications: notifications || [],
      unread_count: unreadCount || 0,
    };

    // Cache result (TTL court car real-time)
    await cacheService.set(cacheKey, result, { ttl: cacheTTL.notifications });

    return result;
  }, '/api/notifications', 'GET');
}

/**
 * POST /api/notifications
 * Crée une nouvelle notification
 */
export async function POST(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(createNotificationSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    interface NotificationInput {
      type: 'success' | 'info' | 'warning' | 'error' | 'order' | 'payment' | 'design' | 'system';
      title: string;
      message: string;
      resource_type?: string;
      resource_id?: string;
      action_url?: string;
      action_label?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      metadata?: Record<string, unknown>;
    }
    
    const validatedData = validation.data as NotificationInput;
    const {
      type,
      title,
      message,
      resource_type,
      resource_id,
      action_url,
      action_label,
      priority = 'normal',
      metadata = {},
    } = validatedData;

    // Créer la notification
    const { data: notification, error: dbError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type,
        title,
        message,
        resource_type,
        resource_id,
        action_url,
        action_label,
        priority,
        metadata,
      })
      .select()
      .single();

    if (dbError) {
      logger.dbError('create notification', dbError, { userId: user.id, type });
      throw { status: 500, message: 'Erreur lors de la création de la notification' };
    }

    // Invalider le cache des notifications
    await cacheService.deleteMany([
      cacheKeys.notifications(user.id, false),
      cacheKeys.notifications(user.id, true),
      cacheKeys.unreadCount(user.id),
    ]);

    // Déclencher les webhooks pour les notifications importantes (non bloquant)
    if (priority === 'high' || type === 'order' || type === 'payment') {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: `notification.${type}`,
            data: {
              notification_id: notification.id,
              type,
              title,
              message,
              priority,
            },
            resource_type,
            resource_id,
          }),
        }).catch((err) => {
          logger.warn('Webhook notification échoué (non bloquant)', { error: err, notificationId: notification.id });
        });
      } catch (webhookError) {
        // Ne pas bloquer la création de notification si le webhook échoue
        logger.warn('Erreur webhook notification (non bloquant)', { error: webhookError });
      }
    }

    return { notification };
  }, '/api/notifications', 'POST');
}

/**
 * PUT /api/notifications
 * Marquer toutes les notifications comme lues
 */
export async function PUT(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(updateNotificationSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    interface UpdateNotificationInput {
      is_read?: boolean;
      is_archived?: boolean;
      mark_all_read?: boolean;
    }
    
    const validatedData = validation.data as UpdateNotificationInput;
    const { mark_all_read } = validatedData;

    if (!mark_all_read) {
      throw { status: 400, message: 'Action non reconnue', code: 'INVALID_ACTION' };
    }

    // Marquer toutes comme lues
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (updateError) {
      logger.dbError('update notifications', updateError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la mise à jour' };
    }

    // Invalider le cache
    await cacheService.deleteMany([
      cacheKeys.notifications(user.id, false),
      cacheKeys.notifications(user.id, true),
      cacheKeys.unreadCount(user.id),
    ]);

    return { message: 'Toutes les notifications ont été marquées comme lues' };
  }, '/api/notifications', 'PUT');
}
