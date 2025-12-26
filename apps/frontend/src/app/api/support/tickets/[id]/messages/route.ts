import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { ApiResponseBuilder } from '@/lib/api-response';

export async function POST(
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

    const body = await request.json();
    const { content, type, isInternal } = body;

    if (!content) {
      throw {
        status: 400,
        message: 'Le contenu du message est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/support/tickets/${params.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        type: type || 'USER',
        isInternal: isInternal || false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: errorData.message || 'Erreur lors de l\'ajout du message',
        code: 'BACKEND_ERROR',
      };
    }

    const data = await response.json();

    return {
      message: data.message || data,
      message: 'Message ajouté avec succès',
    };
  }, `/api/support/tickets/${params.id}/messages`, 'POST');
}

