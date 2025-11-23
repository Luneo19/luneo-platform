import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { idSchema } from '@/lib/validation/zod-schemas';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { apiRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/designs/[id]/versions/auto
 * Crée automatiquement une version avant une mise à jour
 * 
 * Cette route doit être appelée AVANT chaque update de design
 * pour créer automatiquement une sauvegarde
 * Système de versioning automatique complet
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId } = await params;
    
    // Validation UUID
    const uuidValidation = idSchema.safeParse(designId);
    if (!uuidValidation.success) {
      throw { status: 400, message: 'ID de design invalide (format UUID requis)', code: 'INVALID_UUID' };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Rate limiting - Protection contre spam de versions auto
    const identifier = getClientIdentifier(request, user.id);
    const rateLimitResult = await checkRateLimit(identifier, apiRateLimit);
    
    if (!rateLimitResult.success) {
      throw {
        status: 429,
        message: 'Trop de requêtes. Veuillez réessayer plus tard.',
        code: 'RATE_LIMIT_EXCEEDED',
        metadata: {
          reset: rateLimitResult.reset.toISOString(),
          remaining: rateLimitResult.remaining,
        },
      };
    }

    // Validation body avec Zod
    const autoVersionSchema = z.object({
      auto_save: z.boolean().optional().default(true),
    });

    let body;
    try {
      body = await request.json();
    } catch {
      throw { status: 400, message: 'Body JSON invalide', code: 'INVALID_JSON' };
    }

    const validatedBody = autoVersionSchema.parse(body);
    const { auto_save = true } = validatedBody;

    // Récupérer le design actuel
    const { data: design, error: designError } = await supabase
      .from('custom_designs')
      .select('*')
      .eq('id', designId)
      .eq('user_id', user.id)
      .single();

    if (designError || !design) {
      if (designError?.code === 'PGRST116') {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      logger.dbError('fetch design for auto version', designError, { designId, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du design' };
    }

    // Optimisation: Vérifier la dernière version auto ET obtenir le max version_number en une seule requête
    const { data: recentVersionData, error: recentVersionError } = await supabase
      .from('design_versions')
      .select('created_at, version_number, metadata')
      .eq('design_id', designId)
      .eq('metadata->>auto_save', 'true')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Éviter de créer une version si une auto-save a été créée il y a moins de 10 secondes
    if (recentVersionData && !recentVersionError) {
      const lastVersionTime = new Date(recentVersionData.created_at).getTime();
      const now = Date.now();
      const timeSinceLastVersion = now - lastVersionTime;
      
      if (timeSinceLastVersion < 10000) { // 10 secondes
        logger.info('Auto version skipped (recent version exists)', {
          designId,
          userId: user.id,
          timeSinceLastVersion,
        });
        return {
          skipped: true,
          reason: 'Version automatique récente existe déjà',
          last_version_age_seconds: Math.floor(timeSinceLastVersion / 1000),
        };
      }
    }

    // Optimisation: Utiliser MAX pour éviter les race conditions sur version_number
    const { data: maxVersionData } = await supabase
      .from('design_versions')
      .select('version_number')
      .eq('design_id', designId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = (maxVersionData?.version_number || 0) + 1;

    // Créer la version automatique
    const versionData = {
      design_id: designId,
      version_number: nextVersionNumber,
      name: `Version ${nextVersionNumber} - ${new Date().toLocaleString('fr-FR')}`,
      description: 'Sauvegarde automatique',
      design_data: design.design_data || design,
      metadata: {
        created_by: user.id,
        created_at: new Date().toISOString(),
        auto_save: auto_save,
        trigger: 'before_update',
      },
    };

    const { data: version, error: versionError } = await supabase
      .from('design_versions')
      .insert(versionData)
      .select()
      .single();

    if (versionError) {
      logger.dbError('create auto design version', versionError, { 
        designId, 
        userId: user.id 
      });
      // Ne pas bloquer l'update si le versioning échoue
      // Retourner un warning au lieu d'une erreur
      logger.warn('Auto versioning failed, but update can continue', {
        designId,
        userId: user.id,
        error: versionError.message,
      });
      return {
        skipped: true,
        warning: true,
        reason: 'Erreur lors de la création de la version automatique (non bloquant)',
        message: 'L\'update du design peut continuer',
      };
    }

    logger.info('Auto design version created', {
      designId,
      versionId: version.id,
      versionNumber: version.version_number,
      userId: user.id,
    });

    return {
      version,
      version_id: version.id,
      version_number: version.version_number,
      message: 'Version automatique créée avec succès',
    };
  }, '/api/designs/[id]/versions/auto', 'POST');
}

