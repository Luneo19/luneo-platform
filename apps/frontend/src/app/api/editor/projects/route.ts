/**
 * ★★★ API ROUTE - EDITOR PROJECTS ★★★
 * Next.js route for listing and creating editor projects
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder } from '@/lib/api-response';

export async function GET() {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié' };
    }
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      throw { status: 401, message: 'Token manquant' };
    }
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    const resp = await fetch(`${backendUrl}/api/editor/projects`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) throw { status: resp.status, message: 'Erreur backend' };
    return await resp.json();
  }, '/api/editor/projects', 'GET');
}

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié' };
    }
    const body = await request.json();
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      throw { status: 401, message: 'Token manquant' };
    }
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    const resp = await fetch(`${backendUrl}/api/editor/projects`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw { status: resp.status, message: 'Erreur backend' };
    return await resp.json();
  }, '/api/editor/projects', 'POST');
}


