import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/monitoring/metrics
 * Récupère les métriques de monitoring
 * Forward vers backend NestJS: GET /observability/slo, /observability/costs, etc.
 * Note: Nécessite le rôle PLATFORM_ADMIN pour la plupart des routes
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'slo'; // 'slo', 'costs', 'traces', etc.
    const service = searchParams.get('service');
    const metric = searchParams.get('metric');
    const days = searchParams.get('days');

    let url = '';
    const queryParams = new URLSearchParams();

    if (type === 'slo' && service && metric) {
      url = `/observability/slo/${service}/${metric}`;
      if (days) queryParams.set('days', days);
    } else if (type === 'slo') {
      url = '/observability/slo';
    } else if (type === 'costs') {
      url = '/observability/costs';
      const period = searchParams.get('period') || 'month';
      queryParams.set('period', period);
    } else if (type === 'traces') {
      const traceId = searchParams.get('traceId');
      if (traceId) {
        url = `/observability/traces/${traceId}`;
      } else if (service) {
        url = `/observability/traces/service/${service}`;
        const limit = searchParams.get('limit') || '100';
        queryParams.set('limit', limit);
      } else {
        throw {
          status: 400,
          message: 'Pour les traces, spécifiez traceId ou service',
          code: 'VALIDATION_ERROR',
        };
      }
    } else {
      url = `/observability/${type}`;
    }

    const queryString = queryParams.toString();
    const fullUrl = `${url}${queryString ? `?${queryString}` : ''}`;
    const result = await forwardGet(fullUrl, request);
    return result.data;
  }, '/api/monitoring/metrics', 'GET');
}

