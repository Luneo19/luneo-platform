import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * POST /api/notifications/read-all
 * Marque toutes les notifications comme lues
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      logger.warn('Error marking all notifications as read', { error, userId: user.id });
    }

    logger.info('All notifications marked as read', { userId: user.id });

    return { success: true };
  }, '/api/notifications/read-all', 'POST');
}

