import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * POST /api/notifications/[id]/read
 * Marque une notification comme lue
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      logger.warn('Error marking notification as read', { error, notificationId: id });
    }

    return { success: true };
  }, '/api/notifications/[id]/read', 'POST');
}

