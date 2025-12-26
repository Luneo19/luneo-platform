import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { ApiResponseBuilder } from '@/lib/api-response';

/**
 * Monitoring Dashboard API Route
 * Fetches comprehensive monitoring data from backend
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Get token for backend API call
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  (await supabase.auth.getSession()).data.session?.access_token;

    if (!token) {
      throw { status: 401, message: 'Token manquant', code: 'UNAUTHORIZED' };
    }

    // Call backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/monitoring/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: errorData.message || 'Erreur lors de la récupération des données de monitoring',
        code: 'BACKEND_ERROR',
      };
    }

    const data = await response.json();

    return {
      metrics: data.metrics || data,
      services: data.services || [],
      alerts: data.alerts || [],
      timestamp: data.timestamp || new Date().toISOString(),
    };
  }, '/api/monitoring/dashboard', 'GET');
}

