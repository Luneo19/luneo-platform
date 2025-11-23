import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * GET /api/team/members
 * Récupère tous les membres de l'équipe avec pagination
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    // Construire la requête
    let query = supabase
      .from('team_members')
      .select(`
        id,
        email,
        role,
        status,
        invited_at,
        accepted_at,
        permissions,
        user:user_id (
          id,
          email
        ),
        invited_by_user:invited_by (
          id,
          email
        )
      `, { count: 'exact' })
      .eq('organization_id', user.id);

    // Appliquer les filtres
    if (status) {
      query = query.eq('status', status);
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (search && search.trim()) {
      query = query.ilike('email', `%${search.trim()}%`);
    }

    // Pagination et tri
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: teamMembers, error: teamError, count } = await query;

    if (teamError) {
      logger.dbError('fetch team members', teamError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération de l\'équipe' };
    }

    // Enrichir avec les profils
    const enrichedMembers = await Promise.all(
      (teamMembers || []).map(async (member: any) => {
        if (member.user && typeof member.user === 'object' && member.user.id) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', member.user.id)
              .single();

            return {
              ...member,
              name: profile?.name || member.email,
              avatar_url: profile?.avatar_url,
            };
          } catch (profileError) {
            logger.warn('Failed to fetch profile for team member', {
              userId: member.user.id,
              error: profileError,
            });
            return {
              ...member,
              name: member.email,
            };
          }
        }
        return member;
      })
    );

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      members: enrichedMembers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }, '/api/team/members', 'GET');
}
