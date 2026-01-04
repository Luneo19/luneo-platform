import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/credits/transactions
 * Récupère l'historique des transactions de crédits
 */
export async function GET(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPaginationParams(searchParams);

    // Récupérer transactions depuis Prisma DB (via backend API)
    // Note: Les transactions sont dans la table Prisma, pas Supabase directement
    // On peut soit appeler le backend, soit créer une vue Supabase
    
    // Option 1: Appeler backend API
    try {
      const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/credits/transactions?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`, // Ou utiliser un vrai JWT
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          transactions: data.transactions || [],
          pagination: {
            page,
            limit,
            total: data.total || 0,
            pages: Math.ceil((data.total || 0) / limit),
          },
        };
      }
    } catch (fetchError) {
      logger.warn('Failed to fetch transactions from backend, returning empty', {
        error: fetchError,
        userId: user.id,
      });
    }

    // Fallback: Retourner vide si backend non disponible
    // (Les transactions seront disponibles après migration DB)
    return {
      transactions: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
    };
  }, '/api/credits/transactions', 'GET');
}









