import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/health
 * Health check endpoint pour monitoring
 */
export async function GET(_request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        api: 'healthy',
      },
    };

    // Vérifier la connexion à la base de données
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        logger.dbError('health check database', error);
        health.services.database = 'unhealthy';
        health.status = 'degraded';
      } else {
        health.services.database = 'healthy';
      }
    } catch (error: any) {
      logger.error('Health check database error', error);
      health.services.database = 'unhealthy';
      health.status = 'degraded';
    }

    // Déterminer le statut global
    if (health.services.database === 'unhealthy') {
      health.status = 'unhealthy';
    }

    logger.debug('Health check performed', {
      status: health.status,
      database: health.services.database,
    });

    return health;
  }, '/api/health', 'GET');
}
