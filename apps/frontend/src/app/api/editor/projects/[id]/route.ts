/**
 * ★★★ API ROUTE - EDITOR PROJECT BY ID ★★★
 * Next.js route for get/update/delete editor project
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder } from '@/lib/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw { status: 401, message: 'Non authentifié' };
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) throw { status: 401, message: 'Token manquant' };
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    const resp = await fetch(`${backendUrl}/api/editor/projects/${params.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) throw { status: resp.status, message: 'Erreur backend' };
    return await resp.json();
  }, '/api/editor/projects/[id]', 'GET');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw { status: 401, message: 'Non authentifié' };
    const body = await request.json();
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) throw { status: 401, message: 'Token manquant' };
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    const resp = await fetch(`${backendUrl}/api/editor/projects/${params.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw { status: resp.status, message: 'Erreur backend' };
    return await resp.json();
  }, '/api/editor/projects/[id]', 'PUT');
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw { status: 401, message: 'Non authentifié' };
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) throw { status: 401, message: 'Token manquant' };
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    const resp = await fetch(`${backendUrl}/api/editor/projects/${params.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) throw { status: resp.status, message: 'Erreur backend' };
    return { success: true };
  }, '/api/editor/projects/[id]', 'DELETE');
}


