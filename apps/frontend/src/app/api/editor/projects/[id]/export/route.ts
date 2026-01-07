/**
 * ★★★ API ROUTE - EDITOR PROJECT EXPORT ★★★
 * Next.js route to export an editor project (png|jpg|svg|pdf)
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder } from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw { status: 401, message: 'Non authentifié' };
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'png';
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) throw { status: 401, message: 'Token manquant' };
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    const resp = await fetch(`${backendUrl}/api/editor/projects/${params.id}/export?format=${encodeURIComponent(format)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) throw { status: resp.status, message: 'Erreur backend' };
    return await resp.json();
  }, '/api/editor/projects/[id]/export', 'POST');
}


