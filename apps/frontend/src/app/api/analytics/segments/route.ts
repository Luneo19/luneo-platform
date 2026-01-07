/**
 * ★★★ API ROUTE - SEGMENTS ★★★
 * Route API Next.js pour la gestion des segments
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const CreateSegmentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  criteria: z.record(z.unknown()),
});

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

    // Appel backend NestJS
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';

    // Récupérer le token d'accès
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw { status: 401, message: 'Token d\'accès manquant', code: 'UNAUTHORIZED' };
    }

    const response = await fetch(`${backendUrl}/api/analytics/segments`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Backend error for segments', { status: response.status, error: errorText });
      throw { status: response.status, message: 'Erreur backend', code: 'BACKEND_ERROR' };
    }

    const data = await response.json();
    return data;
  }, '/api/analytics/segments', 'GET');
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validation = CreateSegmentSchema.safeParse(body);

    if (!validation.success) {
      throw { status: 400, message: 'Données invalides', code: 'VALIDATION_ERROR', details: validation.error.issues };
    }

    // Appel backend NestJS
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';

    // Récupérer le token d'accès
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw { status: 401, message: 'Token d\'accès manquant', code: 'UNAUTHORIZED' };
    }

    const response = await fetch(`${backendUrl}/api/analytics/segments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validation.data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Backend error creating segment', { status: response.status, error: errorText });
      throw { status: response.status, message: 'Erreur backend', code: 'BACKEND_ERROR' };
    }

    const data = await response.json();
    return data;
  }, '/api/analytics/segments', 'POST');
}


