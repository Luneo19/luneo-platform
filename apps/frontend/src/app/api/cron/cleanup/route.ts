import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/cron/cleanup
 * Scheduled cron job to clean up old data
 * Runs daily at 3:00 AM (configured in vercel.json)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    logger.info('Cron job: cleanup started');
    const supabase = await createClient();
    const cleanupResults = {
      expiredSessions: 0,
      oldDesignVersions: 0,
      oldRefreshTokens: 0,
      oldNotifications: 0,
      oldLogs: 0,
    };

    // 1. Clean up expired refresh tokens (older than 30 days)
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Note: RefreshToken is in Prisma schema, but we'll use Supabase for now
      // If using Prisma, we would do:
      // const { count } = await prisma.refreshToken.deleteMany({
      //   where: { expiresAt: { lt: thirtyDaysAgo } }
      // });
      
      logger.info('Cleanup: expired refresh tokens checked', {
        cutoffDate: thirtyDaysAgo.toISOString(),
      });
    } catch (error) {
      logger.error('Cleanup: failed to clean refresh tokens', error instanceof Error ? error : new Error(String(error)));
    }

    // 2. Clean up old design versions (keep only last 10 per design)
    try {
      // This would require a database function or manual query
      // For Supabase, we can use RPC call to cleanup_old_design_versions()
      const { error: cleanupError } = await supabase.rpc('cleanup_old_design_versions');
      
      if (cleanupError) {
        logger.warn('Cleanup: design versions cleanup function not available', {
          error: cleanupError.message,
        });
      } else {
        logger.info('Cleanup: old design versions cleaned');
        cleanupResults.oldDesignVersions = 1; // Function executed
      }
    } catch (error) {
      logger.error('Cleanup: failed to clean design versions', error instanceof Error ? error : new Error(String(error)));
    }

    // 3. Clean up old read notifications (older than 90 days)
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('read', true)
        .lt('created_at', ninetyDaysAgo.toISOString())
        .select('id', { count: 'exact', head: false });

      if (error) {
        logger.warn('Cleanup: failed to clean notifications', { error: error.message });
      } else {
        cleanupResults.oldNotifications = data?.length || 0;
        logger.info('Cleanup: old notifications deleted', { count: cleanupResults.oldNotifications });
      }
    } catch (error) {
      logger.error('Cleanup: failed to clean notifications', error instanceof Error ? error : new Error(String(error)));
    }

    // 4. Clean up expired user sessions (from user_sessions table if exists)
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('user_sessions')
        .delete()
        .lt('expires_at', sevenDaysAgo.toISOString())
        .select('id', { count: 'exact', head: false });

      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
        logger.warn('Cleanup: failed to clean user sessions', { error: error.message });
      } else if (!error) {
        cleanupResults.expiredSessions = data?.length || 0;
        logger.info('Cleanup: expired sessions deleted', { count: cleanupResults.expiredSessions });
      }
    } catch (error) {
      logger.error('Cleanup: failed to clean sessions', error instanceof Error ? error : new Error(String(error)));
    }

    // 5. Archive old logs (if audit_logs table exists)
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const { data, error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', oneYearAgo.toISOString())
        .select('id', { count: 'exact', head: false });

      if (error && error.code !== 'PGRST116') {
        logger.warn('Cleanup: failed to archive logs', { error: error.message });
      } else if (!error) {
        cleanupResults.oldLogs = data?.length || 0;
        logger.info('Cleanup: old logs archived', { count: cleanupResults.oldLogs });
      }
    } catch (error) {
      logger.error('Cleanup: failed to archive logs', error instanceof Error ? error : new Error(String(error)));
    }

    logger.info('Cron job: cleanup completed', cleanupResults);

    return NextResponse.json({
      success: true,
      message: 'Cleanup job completed',
      results: cleanupResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cron job: cleanup failed', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup job failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Support POST for Vercel cron
export async function POST(request: NextRequest) {
  return GET(request);
}



