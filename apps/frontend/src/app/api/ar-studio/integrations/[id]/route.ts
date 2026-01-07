/**
 * ★★★ API ROUTE - AR INTEGRATION BY ID ★★★
 * Route API Next.js pour la gestion d'une intégration AR spécifique
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const UpdateIntegrationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  settings: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw { status: 401, message: 'Token d\'accès manquant', code: 'UNAUTHORIZED' };
    }

    const response = await fetch(`${backendUrl}/api/ar-studio/integrations/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw { status: response.status, message: 'Erreur backend', code: 'BACKEND_ERROR' };
    }

    return await response.json();
  }, '/api/ar-studio/integrations/[id]', 'GET');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    const validation = UpdateIntegrationSchema.safeParse(body);

    if (!validation.success) {
      throw { status: 400, message: 'Données invalides', code: 'VALIDATION_ERROR', details: validation.error.issues };
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw { status: 401, message: 'Token d\'accès manquant', code: 'UNAUTHORIZED' };
    }

    const response = await fetch(`${backendUrl}/api/ar-studio/integrations/${params.id}`, {
      method: 'PUT',
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
    logger.info('AR integration updated', { integrationId: params.id, userId: user.id });

    return data;
  }, '/api/ar-studio/integrations/[id]', 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw { status: 401, message: 'Token d\'accès manquant', code: 'UNAUTHORIZED' };
    }

    const response = await fetch(`${backendUrl}/api/ar-studio/integrations/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw { status: response.status, message: 'Erreur backend', code: 'BACKEND_ERROR' };
    }

    logger.info('AR integration deleted', { integrationId: params.id, userId: user.id });

    return { success: true };
  }, '/api/ar-studio/integrations/[id]', 'DELETE');
}


