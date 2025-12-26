import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { ApiResponseBuilder } from '@/lib/api-response';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured') === 'true';
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (featured) params.append('featured', 'true');
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/support/knowledge-base/articles?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: errorData.message || 'Erreur lors de la récupération des articles',
        code: 'BACKEND_ERROR',
      };
    }

    const data = await response.json();

    return {
      articles: data.articles || data.data?.articles || [],
      total: data.total || 0,
      limit: data.limit || 50,
      offset: data.offset || 0,
      hasMore: data.hasMore || false,
    };
  }, '/api/support/knowledge-base/articles', 'GET');
}

