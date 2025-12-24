import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

type ShareTokenRouteContext = {
  params: Promise<{ token: string }>;
};

/**
 * GET /api/share/[token]
 * Récupère un design partagé via un token
 */
export async function GET(request: Request, { params }: ShareTokenRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { token } = await params;
    const supabase = await createClient();

    // Récupérer le partage
    const { data: share, error: shareError } = await supabase
      .from('design_shares')
      .select(`
        *,
        design:designs (
          id,
          prompt,
          preview_url,
          generated_image_url,
          style,
          size,
          quality,
          created_at
        )
      `)
      .eq('share_token', token)
      .eq('is_active', true)
      .single();

    if (shareError || !share) {
      if (shareError?.code === 'PGRST116') {
        throw { status: 404, message: 'Partage non trouvé ou expiré', code: 'SHARE_NOT_FOUND' };
      }
      logger.dbError('fetch share by token', shareError, { token });
      throw { status: 500, message: 'Erreur lors de la récupération du partage' };
    }

    // Vérifier l'expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      // Désactiver le partage expiré
      await supabase
        .from('design_shares')
        .update({ is_active: false })
        .eq('id', share.id);

      logger.warn('Expired share access attempt', { token, shareId: share.id });
      throw { status: 410, message: 'Ce partage a expiré', code: 'SHARE_EXPIRED' };
    }

    // Vérifier le mot de passe si requis
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (share.requires_password) {
      if (!password) {
        throw {
          status: 401,
          message: 'Mot de passe requis',
          code: 'PASSWORD_REQUIRED',
          requires_password: true,
        };
      }

      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      if (passwordHash !== share.password_hash) {
        logger.warn('Invalid password for share', { token, shareId: share.id });
        throw {
          status: 401,
          message: 'Mot de passe incorrect',
          code: 'INVALID_PASSWORD',
          requires_password: true,
        };
      }
    }

    // Logger la vue (analytics)
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const visitorId = crypto
      .createHash('sha256')
      .update(`${ip}-${userAgent}`)
      .digest('hex')
      .substring(0, 16);

    await supabase.from('share_analytics').insert({
      share_id: share.id,
      visitor_id: visitorId,
      action_type: 'view',
      ip_address: ip,
      user_agent: userAgent,
    });

    // Retourner les données (sans le password_hash)
    const { password_hash, ...shareData } = share;

    logger.info('Shared design accessed', {
      shareId: share.id,
      designId: share.design_id,
      visitorId,
    });

    return { share: shareData };
  }, '/api/share/[token]', 'GET');
}

/**
 * POST /api/share/[token]/action
 * Enregistre une action sur un partage (download, ar_launch, etc.)
 */
export async function POST(request: Request, { params }: ShareTokenRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { token } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { action_type } = body;

    // Validation
    const validActions = ['download', 'ar_launch', 'share'];
    if (!action_type || !validActions.includes(action_type)) {
      throw {
        status: 400,
        message: `Action invalide. Actions valides: ${validActions.join(', ')}`,
        code: 'VALIDATION_ERROR',
      };
    }

    // Récupérer le partage
    const { data: share, error: shareError } = await supabase
      .from('design_shares')
      .select('id, is_active, allow_download, allow_ar_view')
      .eq('share_token', token)
      .single();

    if (shareError || !share) {
      if (shareError?.code === 'PGRST116') {
        throw { status: 404, message: 'Partage non trouvé', code: 'SHARE_NOT_FOUND' };
      }
      logger.dbError('fetch share for action', shareError, { token });
      throw { status: 500, message: 'Erreur lors de la récupération du partage' };
    }

    if (!share.is_active) {
      throw { status: 410, message: 'Ce partage n\'est plus actif', code: 'SHARE_INACTIVE' };
    }

    // Vérifier les permissions
    if (action_type === 'download' && !share.allow_download) {
      throw { status: 403, message: 'Téléchargement non autorisé', code: 'DOWNLOAD_NOT_ALLOWED' };
    }

    if (action_type === 'ar_launch' && !share.allow_ar_view) {
      throw { status: 403, message: 'Vue AR non autorisée', code: 'AR_VIEW_NOT_ALLOWED' };
    }

    // Logger l'action
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const visitorId = crypto
      .createHash('sha256')
      .update(`${ip}-${userAgent}`)
      .digest('hex')
      .substring(0, 16);

    await supabase.from('share_analytics').insert({
      share_id: share.id,
      visitor_id: visitorId,
      action_type,
      ip_address: ip,
      user_agent: userAgent,
    });

    logger.info('Share action logged', {
      shareId: share.id,
      actionType: action_type,
      visitorId,
    });

    return { message: 'Action enregistrée avec succès' };
  }, '/api/share/[token]/action', 'POST');
}
