/**
 * ★★★ API ROUTE - AI TEMPLATES ★★★
 * Route API Next.js pour la gestion des templates AI
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string(),
  subcategory: z.string().optional(),
  prompt: z.string().min(1),
  style: z.string().optional(),
  thumbnailUrl: z.string().url(),
  previewUrl: z.string().url().optional(),
  price: z.number().nonnegative().default(0),
  isPremium: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
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
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

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
      ...(category && { category }),
      ...(search && { search }),
    });

    const response = await fetch(`${backendUrl}/api/ai-studio/templates?${queryParams}`, {
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
  }, '/api/ai-studio/templates', 'GET');
}

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    const validation = CreateTemplateSchema.safeParse(body);

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

    const response = await fetch(`${backendUrl}/api/ai-studio/templates`, {
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
    logger.info('AI template created', { templateId: data.template?.id, userId: user.id });

    return data;
  }, '/api/ai-studio/templates', 'POST');
}

