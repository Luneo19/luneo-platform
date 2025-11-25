import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { manage2FASchema } from '@/lib/validation/zod-schemas';
import * as speakeasy from 'speakeasy';

/**
 * POST /api/settings/2fa
 * Active ou désactive la 2FA pour l'utilisateur
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(manage2FASchema, request, async (validatedData): Promise<NextResponse<ApiResponse<any>>> => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { action, token } = validatedData;

    if (action === 'enable') {
      // Vérifier le token si fourni (pour la vérification initiale)
      if (token) {
        // Récupérer le secret temporaire
        const { data: tempSecret, error: secretError } = await supabase
          .from('totp_secrets')
          .select('*')
          .eq('user_id', user.id)
          .eq('enabled', false)
          .single();

        if (secretError || !tempSecret) {
          throw {
            status: 400,
            message: 'Aucun secret 2FA trouvé. Veuillez générer un nouveau secret.',
            code: 'NO_SECRET_FOUND',
          };
        }

        // Vérifier le token
        const verified = speakeasy.totp.verify({
          secret: tempSecret.secret,
          encoding: 'base32',
          token,
          window: 2, // Permet une fenêtre de 2 périodes (60 secondes)
        });

        if (!verified) {
          logger.warn('Invalid 2FA token during enable', { userId: user.id });
          throw {
            status: 400,
            message: 'Token 2FA invalide',
            code: 'INVALID_TOKEN',
          };
        }

        // Activer la 2FA
        const { data: updatedSecret, error: updateError } = await supabase
          .from('totp_secrets')
          .update({
            enabled: true,
            verified_at: new Date().toISOString(),
          })
          .eq('id', tempSecret.id)
          .select()
          .single();

        if (updateError) {
          logger.dbError('enable 2FA', updateError, { userId: user.id });
          throw { status: 500, message: 'Erreur lors de l\'activation de la 2FA' };
        }

        logger.info('2FA enabled', { userId: user.id });

        return ApiResponseBuilder.success({
          enabled: true,
        }, '2FA activée avec succès');
      }

      // Générer un nouveau secret TOTP
      const secret = speakeasy.generateSecret({
        name: `Luneo (${user.email})`,
        issuer: 'Luneo',
      });

      // Générer des codes de secours
      const backupCodes = Array.from({ length: 10 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );

      // Sauvegarder dans la base de données (non activé pour l'instant)
      const { data: savedSecret, error: saveError } = await supabase
        .from('totp_secrets')
        .upsert({
          user_id: user.id,
          secret: secret.base32,
          enabled: false, // Pas encore activé, attend la vérification
          backup_codes: backupCodes,
          verified_at: null,
        })
        .select()
        .single();

      if (saveError) {
        logger.dbError('save 2FA secret', saveError, { userId: user.id });
        throw { status: 500, message: 'Erreur lors de la génération du secret 2FA' };
      }

      logger.info('2FA secret generated', { userId: user.id });

      return ApiResponseBuilder.success({
        qrCode: secret.otpauth_url,
        backupCodes,
        secretId: savedSecret.id,
      }, 'Scannez le QR code avec votre application d\'authentification');
    } else if (action === 'disable') {
      // Désactiver la 2FA
      const { error: disableError } = await supabase
        .from('totp_secrets')
        .update({ enabled: false })
        .eq('user_id', user.id);

      if (disableError) {
        logger.dbError('disable 2FA', disableError, { userId: user.id });
        throw { status: 500, message: 'Erreur lors de la désactivation de la 2FA' };
      }

      logger.info('2FA disabled', { userId: user.id });

      return ApiResponseBuilder.success({
        enabled: false,
      }, '2FA désactivée avec succès');
    }

    throw {
      status: 400,
      message: 'Action invalide',
      code: 'VALIDATION_ERROR',
    };
  });
}

/**
 * GET /api/settings/2fa
 * Récupère le statut de la 2FA pour l'utilisateur
 */
export async function GET(_request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { data: secret, error } = await supabase
      .from('totp_secrets')
      .select('enabled, verified_at, created_at')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.dbError('fetch 2FA status', error, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du statut 2FA' };
    }

    return ApiResponseBuilder.success({
      enabled: secret?.enabled || false,
      verified_at: secret?.verified_at || null,
      created_at: secret?.created_at || null,
    });
  }, '/api/settings/2fa', 'GET');
}
