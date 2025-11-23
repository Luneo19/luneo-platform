import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

type NotificationRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/notifications/[id]
 * Récupère une notification spécifique
 */
export async function GET(request: Request, { params }: NotificationRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (notificationError || !notification) {
      if (notificationError?.code === 'PGRST116') {
        throw { status: 404, message: 'Notification non trouvée', code: 'NOTIFICATION_NOT_FOUND' };
      }
      logger.dbError('fetch notification', notificationError, {
        notificationId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération de la notification' };
    }

    return { notification };
  }, '/api/notifications/[id]', 'GET');
}

/**
 * PUT /api/notifications/[id]
 * Met à jour une notification (marquer comme lue, archiver, etc.)
 */
export async function PUT(request: Request, { params }: NotificationRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que la notification existe et appartient à l'utilisateur
    const { data: existingNotification, error: checkError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingNotification) {
      logger.warn('Notification update attempt on non-existent or unauthorized notification', {
        notificationId: id,
        userId: user.id,
      });
      throw { status: 404, message: 'Notification non trouvée', code: 'NOTIFICATION_NOT_FOUND' };
    }

    const body = await request.json();
    const { is_read, is_archived } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (is_read !== undefined) {
      updateData.is_read = is_read;
      if (is_read && !existingNotification.read_at) {
        updateData.read_at = new Date().toISOString();
      }
    }

    if (is_archived !== undefined) {
      updateData.is_archived = is_archived;
      if (is_archived && !existingNotification.archived_at) {
        updateData.archived_at = new Date().toISOString();
      }
    }

    const { data: updatedNotification, error: updateError } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update notification', updateError, {
        notificationId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la mise à jour de la notification' };
    }

    logger.info('Notification updated', {
      notificationId: id,
      userId: user.id,
      isRead: is_read,
      isArchived: is_archived,
    });

    return { notification: updatedNotification };
  }, '/api/notifications/[id]', 'PUT');
}

/**
 * DELETE /api/notifications/[id]
 * Supprime une notification
 */
export async function DELETE(request: Request, { params }: NotificationRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que la notification existe et appartient à l'utilisateur
    const { data: existingNotification, error: checkError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingNotification) {
      logger.warn('Notification delete attempt on non-existent or unauthorized notification', {
        notificationId: id,
        userId: user.id,
      });
      throw { status: 404, message: 'Notification non trouvée', code: 'NOTIFICATION_NOT_FOUND' };
    }

    // Supprimer la notification
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      logger.dbError('delete notification', deleteError, {
        notificationId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la suppression de la notification' };
    }

    logger.info('Notification deleted', {
      notificationId: id,
      userId: user.id,
    });

    return { message: 'Notification supprimée avec succès' };
  }, '/api/notifications/[id]', 'DELETE');
}
