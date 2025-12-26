import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { inviteTeamMemberSchema } from '@/lib/validation/zod-schemas';
import crypto from 'crypto';

/**
 * POST /api/team/invite
 * Invite un nouveau membre à l'équipe
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    
    // Validation Zod
    const validation = inviteTeamMemberSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { email, role = 'member' } = validation.data;

    // Vérifier si l'invitation existe déjà
    const { data: existingInvite, error: checkError } = await supabase
      .from('team_invites')
      .select('id, status')
      .eq('email', email)
      .eq('organization_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existingInvite && !checkError) {
      throw {
        status: 409,
        message: 'Une invitation est déjà en attente pour cet email',
        code: 'DUPLICATE_INVITATION',
      };
    }

    // Générer un token d'invitation
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    // Créer l'invitation
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .insert({
        email,
        role,
        invited_by: user.id,
        organization_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (inviteError) {
      logger.dbError('create team invite', inviteError, {
        userId: user.id,
        email,
      });
      throw { status: 500, message: 'Erreur lors de la création de l\'invitation' };
    }

    // Envoyer l'email d'invitation (non bloquant)
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';
      const inviteUrl = `${appUrl}/team/accept?token=${token}`;
      
      await fetch(`${appUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Invitation à rejoindre une équipe sur Luneo`,
          template: 'team-invite',
          data: {
            inviterName: user.email?.split('@')[0] || 'Un membre de l\'équipe',
            inviterEmail: user.email,
            teamRole: role,
            inviteUrl,
            expiresIn: '7 jours',
          },
        }),
        signal: AbortSignal.timeout(5000),
      }).catch((err) => {
        logger.warn('Failed to send team invitation email', {
          email,
          error: err,
        });
      });

      logger.info('Team invitation email sent', { email, userId: user.id });
    } catch (emailError) {
      logger.warn('Error sending team invitation email', {
        email,
        error: emailError,
      });
      // Ne pas bloquer la création de l'invitation si l'email échoue
    }

    logger.info('Team member invited', {
      inviteId: invite.id,
      userId: user.id,
      email,
      role,
    });

    return ApiResponseBuilder.success({
      invite: {
        ...invite,
        inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.luneo.app'}/team/accept?token=${token}`,
      },
    }, 'Invitation envoyée avec succès', 201);
  }, '/api/team/invite', 'POST');
}

/**
 * GET /api/team/invite
 * Récupère toutes les invitations en attente
 */
export async function GET(_request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { data: invites, error: invitesError } = await supabase
      .from('team_invites')
      .select('*')
      .eq('organization_id', user.id)
      .order('created_at', { ascending: false });

    if (invitesError) {
      logger.dbError('fetch team invites', invitesError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération des invitations' };
    }

    return ApiResponseBuilder.success({ invites: invites || [] });
  }, '/api/team/invite', 'GET');
}

/**
 * DELETE /api/team/invite
 * Annule une invitation
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('id');

    if (!inviteId) {
      throw {
        status: 400,
        message: 'Paramètre id manquant',
        code: 'VALIDATION_ERROR',
      };
    }

    // Vérifier que l'invitation existe et appartient à l'organisation
    const { data: existingInvite, error: checkError } = await supabase
      .from('team_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('organization_id', user.id)
      .single();

    if (checkError || !existingInvite) {
      logger.warn('Team invite cancellation attempt on non-existent or unauthorized invite', {
        inviteId,
        userId: user.id,
      });
      throw { status: 404, message: 'Invitation non trouvée', code: 'INVITE_NOT_FOUND' };
    }

    // Annuler l'invitation
    const { error: updateError } = await supabase
      .from('team_invites')
      .update({ status: 'cancelled' })
      .eq('id', inviteId)
      .eq('organization_id', user.id);

    if (updateError) {
      logger.dbError('cancel team invite', updateError, {
        inviteId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de l\'annulation de l\'invitation' };
    }

    logger.info('Team invite cancelled', {
      inviteId,
      userId: user.id,
      email: existingInvite.email,
    });

    return ApiResponseBuilder.success({}, 'Invitation annulée avec succès');
  }, '/api/team/invite', 'DELETE');
}
