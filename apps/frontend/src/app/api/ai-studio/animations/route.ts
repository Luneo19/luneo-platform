/**
 * ★★★ API ROUTE - AI ANIMATIONS ★★★
 * Route API Next.js pour la génération d'animations AI
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const GenerateAnimationSchema = z.object({
  prompt: z.string().min(1).max(1000),
  style: z.string().optional(),
  duration: z.number().int().min(1).max(30).default(5),
  fps: z.number().int().min(24).max(60).default(30),
  resolution: z.enum(['720p', '1080p', '4k']).default('1080p'),
});

export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const status = searchParams.get('status') || undefined;

    // Appel backend NestJS
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';

    // Récupérer le token d'accès
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw { status: 401, message: 'Token d\'accès manquant', code: 'UNAUTHORIZED' };
    }

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });

    const response = await fetch(`${backendUrl}/api/ai-studio/animations?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw { status: response.status, message: 'Erreur backend', code: 'BACKEND_ERROR' };
    }

    const data = await response.json();
    return data;
  }, '/api/ai-studio/animations', 'GET');
}

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    const validation = GenerateAnimationSchema.safeParse(body);

    if (!validation.success) {
      throw { status: 400, message: 'Données invalides', code: 'VALIDATION_ERROR', details: validation.error.issues };
    }

    // Appel backend NestJS pour générer l'animation
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';

    // Récupérer le token d'accès
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw { status: 401, message: 'Token d\'accès manquant', code: 'UNAUTHORIZED' };
    }

    const response = await fetch(`${backendUrl}/api/ai-studio/animations/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validation.data),
    });

    if (!response.ok) {
      throw { status: response.status, message: 'Erreur backend', code: 'BACKEND_ERROR' };
    }

    const data = await response.json();
    logger.info('AI animation generation started', { animationId: data.animation?.id, userId: user.id });

    return data;
  }, '/api/ai-studio/animations', 'POST');
}

