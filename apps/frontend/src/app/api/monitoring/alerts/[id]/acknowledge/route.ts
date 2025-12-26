import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { ApiResponseBuilder } from '@/lib/api-response';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  (await supabase.auth.getSession()).data.session?.access_token;

    if (!token) {
      throw { status: 401, message: 'Token manquant', code: 'UNAUTHORIZED' };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/monitoring/alerts/${params.id}/acknowledge`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: errorData.message || 'Erreur lors de l\'acquittement de l\'alerte',
        code: 'BACKEND_ERROR',
      };
    }

    const data = await response.json();

    return {
      alert: data,
      message: 'Alerte acquittée avec succès',
    };
  }, `/api/monitoring/alerts/${params.id}/acknowledge`, 'PATCH');
}

