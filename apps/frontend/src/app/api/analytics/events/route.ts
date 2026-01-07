/**
 * ★★★ API ROUTE - BEHAVIORAL EVENTS ★★★
 * Route API Next.js pour les événements comportementaux
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer le brandId de l'utilisateur
    const { data: profile } = await supabase
      .from('users')
      .select('brand_id')
      .eq('id', user.id)
      .single();

    if (!profile?.brand_id) {
      throw { status: 403, message: 'Utilisateur doit avoir une marque', code: 'FORBIDDEN' };
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const eventType = searchParams.get('eventType') || undefined;

    // Appel backend NestJS
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    
    // Construire l'URL avec les query params
    const params = new URLSearchParams();
    if (timeRange) params.append('timeRange', timeRange);
    if (eventType) params.append('eventType', eventType);

    // Récupérer le token d'accès
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw { status: 401, message: 'Token d\'accès manquant', code: 'UNAUTHORIZED' };
    }

    const response = await fetch(`${backendUrl}/api/analytics/events?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Backend error for events', { status: response.status, error: errorText });
      throw { status: response.status, message: 'Erreur backend', code: 'BACKEND_ERROR' };
    }

    const data = await response.json();
    return data;
  }, '/api/analytics/events', 'GET');
}
