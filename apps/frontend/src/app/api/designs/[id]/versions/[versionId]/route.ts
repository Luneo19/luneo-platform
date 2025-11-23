import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { idSchema } from '@/lib/validation/zod-schemas';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { apiRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/designs/[id]/versions/[versionId]
 * Récupère une version spécifique d'un design
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId, versionId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Validation des UUIDs avec Zod
    const designIdValidation = idSchema.safeParse(designId);
    const versionIdValidation = idSchema.safeParse(versionId);
    
    if (!designIdValidation.success) {
      throw { status: 400, message: 'ID de design invalide (format UUID requis)', code: 'INVALID_UUID' };
    }
    if (!versionIdValidation.success) {
      throw { status: 400, message: 'ID de version invalide (format UUID requis)', code: 'INVALID_UUID' };
    }

    // Requête optimisée : vérifier ownership ET récupérer la version en une seule requête
    const { data: version, error: versionError } = await supabase
      .from('design_versions')
      .select(`
        *,
        custom_designs!inner(id, user_id)
      `)
      .eq('id', versionId)
      .eq('design_id', designId)
      .eq('custom_designs.user_id', user.id)
      .single();

    if (versionError || !version) {
      if (versionError?.code === 'PGRST116') {
        throw { status: 404, message: 'Version non trouvée', code: 'VERSION_NOT_FOUND' };
      }
      logger.dbError('fetch design version', versionError, { designId, versionId, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération de la version' };
    }

    logger.info('Design version fetched', {
      designId,
      versionId,
      userId: user.id,
    });

    return { version };
  }, '/api/designs/[id]/versions/[versionId]', 'GET');
}

/**
 * POST /api/designs/[id]/versions/[versionId]/restore
 * Restaure une version (crée une nouvelle version avec les données de l'ancienne)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId, versionId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Rate limiting
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

    // Validation des UUIDs avec Zod
    const designIdValidation = idSchema.safeParse(designId);
    const versionIdValidation = idSchema.safeParse(versionId);
    
    if (!designIdValidation.success) {
      throw { status: 400, message: 'ID de design invalide (format UUID requis)', code: 'INVALID_UUID' };
    }
    if (!versionIdValidation.success) {
      throw { status: 400, message: 'ID de version invalide (format UUID requis)', code: 'INVALID_UUID' };
    }

    // Vérifier que le design appartient à l'utilisateur et récupérer le design
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
      logger.dbError('fetch design for restore', designError, { designId, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du design' };
    }

    // Récupérer la version à restaurer
    const { data: versionToRestore, error: versionError } = await supabase
      .from('design_versions')
      .select('*')
      .eq('id', versionId)
      .eq('design_id', designId)
      .single();

    if (versionError || !versionToRestore) {
      if (versionError?.code === 'PGRST116') {
        throw { status: 404, message: 'Version non trouvée', code: 'VERSION_NOT_FOUND' };
      }
      logger.dbError('fetch version to restore', versionError, { designId, versionId });
      throw { status: 500, message: 'Erreur lors de la récupération de la version' };
    }

    // Optimisation: Utiliser MAX pour éviter les race conditions sur version_number
    const { data: maxVersion } = await supabase
      .from('design_versions')
      .select('version_number')
      .eq('design_id', designId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = (maxVersion?.version_number || 0) + 1;
    const restoreVersionNumber = nextVersionNumber + 1;

    // Créer une sauvegarde de la version actuelle avant restauration (transaction implicite)
    const backupVersionData = {
      design_id: designId,
      version_number: nextVersionNumber,
      name: `Sauvegarde avant restauration v${versionToRestore.version_number}`,
      description: 'Sauvegarde automatique avant restauration',
      design_data: design.design_data || design,
      metadata: {
        created_by: user.id,
        created_at: new Date().toISOString(),
        auto_save: true,
        before_restore: true,
      },
    };

    const { error: backupError } = await supabase
      .from('design_versions')
      .insert(backupVersionData);

    if (backupError) {
      logger.dbError('create backup version before restore', backupError, { designId, versionId });
      throw { status: 500, message: 'Erreur lors de la création de la sauvegarde' };
    }

    // Restaurer le design avec les données de la version
    const { error: updateError } = await supabase
      .from('custom_designs')
      .update({
        design_data: versionToRestore.design_data,
        updated_at: new Date().toISOString(),
        metadata: {
          ...(design.metadata || {}),
          restored_from_version: versionId,
          restored_at: new Date().toISOString(),
        },
      })
      .eq('id', designId);

    if (updateError) {
      logger.dbError('restore design version', updateError, { designId, versionId });
      throw { status: 500, message: 'Erreur lors de la restauration du design' };
    }

    // Créer une nouvelle version avec les données restaurées
    const { data: newVersion, error: newVersionError } = await supabase
      .from('design_versions')
      .insert({
        design_id: designId,
        version_number: restoreVersionNumber,
        name: `Restauration de v${versionToRestore.version_number}`,
        description: `Design restauré depuis la version ${versionToRestore.version_number}`,
        design_data: versionToRestore.design_data,
        metadata: {
          created_by: user.id,
          created_at: new Date().toISOString(),
          restored: true,
          restored_from: versionId,
        },
      })
      .select()
      .single();

    if (newVersionError) {
      logger.dbError('create restored version', newVersionError, { designId, versionId });
      throw { status: 500, message: 'Erreur lors de la création de la version restaurée' };
    }

    logger.info('Design version restored', {
      designId,
      versionId,
      restoredVersionId: newVersion.id,
      userId: user.id,
    });

    return {
      restored: true,
      version: newVersion,
      message: 'Version restaurée avec succès',
    };
  }, '/api/designs/[id]/versions/[versionId]/restore', 'POST');
}

/**
 * DELETE /api/designs/[id]/versions/[versionId]
 * Supprime une version d'un design
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId, versionId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Rate limiting
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

    // Validation des UUIDs avec Zod
    const designIdValidation = idSchema.safeParse(designId);
    const versionIdValidation = idSchema.safeParse(versionId);
    
    if (!designIdValidation.success) {
      throw { status: 400, message: 'ID de design invalide (format UUID requis)', code: 'INVALID_UUID' };
    }
    if (!versionIdValidation.success) {
      throw { status: 400, message: 'ID de version invalide (format UUID requis)', code: 'INVALID_UUID' };
    }

    // Vérifier que le design appartient à l'utilisateur
    const { data: design, error: designError } = await supabase
      .from('custom_designs')
      .select('id')
      .eq('id', designId)
      .eq('user_id', user.id)
      .single();

    if (designError || !design) {
      if (designError?.code === 'PGRST116') {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      logger.dbError('fetch design for version deletion', designError, { designId, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la vérification du design' };
    }

    // Vérifier que la version existe avant suppression
    const { data: version, error: versionCheckError } = await supabase
      .from('design_versions')
      .select('id, version_number')
      .eq('id', versionId)
      .eq('design_id', designId)
      .single();

    if (versionCheckError || !version) {
      if (versionCheckError?.code === 'PGRST116') {
        throw { status: 404, message: 'Version non trouvée', code: 'VERSION_NOT_FOUND' };
      }
      logger.dbError('check version before deletion', versionCheckError, { designId, versionId });
      throw { status: 500, message: 'Erreur lors de la vérification de la version' };
    }

    // Supprimer la version
    const { error: deleteError } = await supabase
      .from('design_versions')
      .delete()
      .eq('id', versionId)
      .eq('design_id', designId);

    if (deleteError) {
      logger.dbError('delete design version', deleteError, { designId, versionId, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la suppression de la version' };
    }

    logger.info('Design version deleted', {
      designId,
      versionId,
      versionNumber: version.version_number,
      userId: user.id,
    });

    return {
      deleted: true,
      message: 'Version supprimée avec succès',
    };
  }, '/api/designs/[id]/versions/[versionId]', 'DELETE');
}

