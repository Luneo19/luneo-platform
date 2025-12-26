import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { shareDesignSchema } from '@/lib/validation/zod-schemas';
import crypto from 'crypto';

type DesignShareRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/designs/[id]/share
 * Crée un lien de partage pour un design
 */
export async function POST(request: Request, { params }: DesignShareRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que le design existe et appartient à l'utilisateur
    const { data: design, error: designError } = await supabase
      .from('designs')
      .select('id, user_id')
      .eq('id', designId)
      .eq('user_id', user.id)
      .single();

    if (designError || !design) {
      if (designError?.code === 'PGRST116') {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      logger.dbError('fetch design for share', designError, {
        designId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du design' };
    }

    const body = await request.json();
    
    // Validation Zod
    const validation = shareDesignSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { expires_in_days = 30, password } = validation.data;

    // Générer un token de partage sécurisé
    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    // Créer l'enregistrement de partage
    const { data: share, error: shareError } = await supabase
      .from('design_shares')
      .insert({
        design_id: designId,
        user_id: user.id,
        token: shareToken,
        expires_at: expiresAt.toISOString(),
        password: password ? await hashPassword(password) : null,
        access_count: 0,
      })
      .select()
      .single();

    if (shareError) {
      logger.dbError('create design share', shareError, {
        designId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la création du lien de partage' };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';
    const shareUrl = `${appUrl}/share/${shareToken}`;

    logger.info('Design share created', {
      designId,
      userId: user.id,
      shareId: share.id,
      expiresAt: expiresAt.toISOString(),
    });

    return ApiResponseBuilder.success({
      share: {
        ...share,
        shareUrl,
      },
    }, 'Lien de partage créé avec succès', 201);
  }, '/api/designs/[id]/share', 'POST');
}

/**
 * GET /api/designs/[id]/share
 * Récupère les liens de partage existants pour un design
 */
export async function GET(request: Request, { params }: DesignShareRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que le design existe et appartient à l'utilisateur
    const { data: design, error: designError } = await supabase
      .from('designs')
      .select('id, user_id')
      .eq('id', designId)
      .eq('user_id', user.id)
      .single();

    if (designError || !design) {
      if (designError?.code === 'PGRST116') {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      logger.dbError('fetch design for shares', designError, {
        designId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du design' };
    }

    // Récupérer les liens de partage
    const { data: shares, error: sharesError } = await supabase
      .from('design_shares')
      .select('*')
      .eq('design_id', designId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (sharesError) {
      logger.dbError('fetch design shares', sharesError, {
        designId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération des liens de partage' };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';
    const sharesWithUrl = (shares || []).map((share) => ({
      ...share,
      shareUrl: `${appUrl}/share/${share.token}`,
      isExpired: share.expires_at ? new Date(share.expires_at) < new Date() : false,
    }));

    return ApiResponseBuilder.success({ shares: sharesWithUrl });
  }, '/api/designs/[id]/share', 'GET');
}

/**
 * Helper pour hasher un mot de passe
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
