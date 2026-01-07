/**
 * ★★★ API ROUTE - SYNC AR INTEGRATION ★★★
 * Route API Next.js pour synchroniser une intégration AR
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'manual';

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw { status: 401, message: 'Token d\'accès manquant', code: 'UNAUTHORIZED' };
    }

    const response = await fetch(`${backendUrl}/api/ar-studio/integrations/${params.id}/sync?type=${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw { status: response.status, message: 'Erreur backend', code: 'BACKEND_ERROR' };
    }

    const data = await response.json();
    logger.info('AR integration sync started', { integrationId: params.id, userId: user.id, type });

    return data;
  }, '/api/ar-studio/integrations/[id]/sync', 'POST');
}

