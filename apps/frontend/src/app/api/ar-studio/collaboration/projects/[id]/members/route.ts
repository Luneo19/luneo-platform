/**
 * ★★★ API ROUTE - ADD MEMBER TO AR PROJECT ★★★
 * Route API Next.js pour ajouter un membre à un projet AR
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const AddMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['editor', 'viewer']),
});

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

    const body = await request.json();
    const validation = AddMemberSchema.safeParse(body);

    if (!validation.success) {
      throw { status: 400, message: 'Données invalides', code: 'VALIDATION_ERROR', details: validation.error.issues };
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw { status: 401, message: 'Token d\'accès manquant', code: 'UNAUTHORIZED' };
    }

    const response = await fetch(`${backendUrl}/api/ar-studio/collaboration/projects/${params.id}/members`, {
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
    logger.info('Member added to AR project', { projectId: params.id, userId: user.id, memberId: validation.data.userId });

    return data;
  }, '/api/ar-studio/collaboration/projects/[id]/members', 'POST');
}

