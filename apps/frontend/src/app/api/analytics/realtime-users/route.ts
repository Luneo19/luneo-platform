import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/analytics/realtime-users
 * Récupère les utilisateurs en temps réel
 * Query params: period? (last 1h, 24h, etc.)
 * Forward vers backend NestJS: GET /api/analytics/realtime ou similaire
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    try {
      // Essayer de récupérer depuis le backend (si endpoint existe)
      const result = await forwardGet('/analytics/realtime', request, {});

      return result.data || { users: [] };
    } catch (error) {
      // Si l'endpoint n'existe pas encore, retourner un tableau vide
      // plutôt que des données mockées
      return { users: [] };
    }
  }, '/api/analytics/realtime-users', 'GET');
}
