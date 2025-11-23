import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest, validateWithZodSchema } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { inviteTeamMemberSchema } from '@/lib/validation/zod-schemas';
import crypto from 'crypto';

/**
 * GET /api/team
 * Récupère tous les membres de l'équipe
 */
export async function GET() {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer les membres de l'équipe
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select(`
        id,
        email,
        role,
        status,
        invited_at,
        accepted_at,
        last_active_at,
        permissions,
        user:user_id (
          id,
          email
        ),
        invited_by_user:invited_by (
          id,
          email
        )
      `)
      .eq('organization_id', user.id)
      .order('created_at', { ascending: false });

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

    return { members: enrichedMembers };
  }, '/api/team', 'GET');
}

/**
 * POST /api/team
 * Inviter un nouveau membre
 */
export async function POST(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(inviteTeamMemberSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const validatedData = validation.data as {
      email: string;
      role?: 'owner' | 'admin' | 'member' | 'viewer';
      permissions?: string[];
    };
    const { email, role = 'member', permissions = [] } = validatedData;

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email).catch(() => ({ data: null }));

    // Vérifier si l'invitation existe déjà
    const { data: existingInvitation } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', user.id)
      .eq('email', email)
      .single();

    if (existingInvitation) {
      throw {
        status: 409,
        message: 'Une invitation existe déjà pour cet email',
        code: 'DUPLICATE_INVITATION',
      };
    }

    // Générer un token d'invitation
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    // Créer l'invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('team_members')
      .insert({
        organization_id: user.id,
        email,
        role,
        permissions: Array.isArray(permissions) ? permissions : [],
        status: existingUser ? 'pending' : 'invited',
        invitation_token: invitationToken,
        invitation_expires_at: expiresAt.toISOString(),
        invited_by: user.id,
        user_id: existingUser?.id || null,
      })
      .select()
      .single();

    if (invitationError) {
      logger.dbError('create team invitation', invitationError, {
        userId: user.id,
        email,
      });
      throw { status: 500, message: 'Erreur lors de la création de l\'invitation' };
    }

    // Envoyer l'email d'invitation (non bloquant)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `Invitation à rejoindre l'équipe ${user.email}`,
          template: 'team-invitation',
          data: {
            inviterEmail: user.email,
            invitationToken,
            invitationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/team/accept?token=${invitationToken}`,
          },
        }),
      }).catch((err) => {
        logger.warn('Failed to send team invitation email', {
          email,
          error: err,
        });
      });
    } catch (emailError) {
      logger.warn('Error sending team invitation email', { email, error: emailError });
    }

    logger.info('Team member invited', {
      invitationId: invitation.id,
      userId: user.id,
      email,
      role,
    });

    return { invitation };
  }, '/api/team', 'POST');
}
