import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';

type TeamMemberRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/team/[id]
 * Récupère un membre d'équipe spécifique
 */
export async function GET(request: Request, { params }: TeamMemberRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer le membre d'équipe
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select(`
        *,
        user:user_id (
          id,
          email
        ),
        invited_by_user:invited_by (
          id,
          email
        )
      `)
      .eq('id', id)
      .eq('organization_id', user.id)
      .single();

    if (memberError || !member) {
      if (memberError?.code === 'PGRST116') {
        throw { status: 404, message: 'Membre d\'équipe non trouvé', code: 'TEAM_MEMBER_NOT_FOUND' };
      }
      logger.dbError('fetch team member', memberError, {
        memberId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du membre' };
    }

    // Enrichir avec le profil si l'utilisateur existe
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
      }
    }

    return { member };
  }, '/api/team/[id]', 'GET');
}

/**
 * PUT /api/team/[id]
 * Met à jour un membre d'équipe (rôle, permissions)
 */
export async function PUT(request: Request, { params }: TeamMemberRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que le membre existe et appartient à l'organisation
    const { data: existingMember, error: checkError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .eq('organization_id', user.id)
      .single();

    if (checkError || !existingMember) {
      logger.warn('Team member update attempt on non-existent or unauthorized member', {
        memberId: id,
        userId: user.id,
      });
      throw { status: 404, message: 'Membre d\'équipe non trouvé', code: 'TEAM_MEMBER_NOT_FOUND' };
    }

    const body = await request.json();
    const { role, permissions, status: memberStatus } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (role !== undefined) {
      // Valider le rôle
      const validRoles = ['admin', 'manager', 'designer', 'member', 'viewer'];
      if (!validRoles.includes(role)) {
        throw {
          status: 400,
          message: 'Rôle invalide',
          code: 'VALIDATION_ERROR',
        };
      }
      updateData.role = role;
    }

    if (permissions !== undefined) {
      updateData.permissions = Array.isArray(permissions) ? permissions : [];
    }

    if (memberStatus !== undefined) {
      // Valider le statut
      const validStatuses = ['active', 'inactive', 'pending', 'invited'];
      if (!validStatuses.includes(memberStatus)) {
        throw {
          status: 400,
          message: 'Statut invalide',
          code: 'VALIDATION_ERROR',
        };
      }
      updateData.status = memberStatus;
    }

    const { data: updatedMember, error: updateError } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update team member', updateError, {
        memberId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la mise à jour du membre' };
    }

    logger.info('Team member updated', {
      memberId: id,
      userId: user.id,
      role: role || existingMember.role,
    });

    return { member: updatedMember };
  }, '/api/team/[id]', 'PUT');
}

/**
 * DELETE /api/team/[id]
 * Supprime un membre d'équipe
 */
export async function DELETE(request: Request, { params }: TeamMemberRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que le membre existe et appartient à l'organisation
    const { data: existingMember, error: checkError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .eq('organization_id', user.id)
      .single();

    if (checkError || !existingMember) {
      logger.warn('Team member delete attempt on non-existent or unauthorized member', {
        memberId: id,
        userId: user.id,
      });
      throw { status: 404, message: 'Membre d\'équipe non trouvé', code: 'TEAM_MEMBER_NOT_FOUND' };
    }

    // Ne pas permettre de supprimer soi-même
    if (existingMember.user_id === user.id) {
      throw {
        status: 400,
        message: 'Vous ne pouvez pas supprimer votre propre compte',
        code: 'CANNOT_DELETE_SELF',
      };
    }

    // Supprimer le membre
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)
      .eq('organization_id', user.id);

    if (deleteError) {
      logger.dbError('delete team member', deleteError, {
        memberId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la suppression du membre' };
    }

    logger.info('Team member deleted', {
      memberId: id,
      userId: user.id,
      memberEmail: existingMember.email,
    });

    return { message: 'Membre d\'équipe supprimé avec succès' };
  }, '/api/team/[id]', 'DELETE');
}
