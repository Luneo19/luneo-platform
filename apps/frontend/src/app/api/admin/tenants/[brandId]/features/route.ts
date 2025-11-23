import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { manageTenantFeaturesSchema } from '@/lib/validation/zod-schemas';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/rbac';

type TenantFeaturesRouteContext = {
  params: Promise<{ brandId: string }>;
};

/**
 * GET /api/admin/tenants/[brandId]/features
 * Récupère les fonctionnalités activées pour un tenant
 */
export async function GET(request: NextRequest, { params }: TenantFeaturesRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { brandId } = await params;
    const supabase = await createClient();

    // Vérifier les permissions admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier les permissions admin
    await requireAdmin(user.id);

    // Récupérer les fonctionnalités du tenant
    const { data: brand, error: brandError } = await supabase
      .from('Brand')
      .select('id, name, features, plan')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      if (brandError?.code === 'PGRST116') {
        throw { status: 404, message: 'Tenant non trouvé', code: 'TENANT_NOT_FOUND' };
      }
      logger.dbError('fetch tenant features', brandError, {
        brandId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du tenant' };
    }

    // Parser les fonctionnalités (peuvent être JSON ou objet)
    let features = brand.features;
    if (typeof features === 'string') {
      try {
        features = JSON.parse(features);
      } catch (parseError) {
        logger.warn('Failed to parse tenant features JSON', {
          brandId,
          error: parseError,
        });
        features = {};
      }
    }

    logger.info('Tenant features fetched', {
      brandId,
      userId: user.id,
      plan: brand.plan,
    });

    return {
      tenant: {
        id: brand.id,
        name: brand.name,
        plan: brand.plan,
      },
      features: features || {},
    };
  }, '/api/admin/tenants/[brandId]/features', 'GET');
}

/**
 * POST /api/admin/tenants/[brandId]/features
 * Active une fonctionnalité pour un tenant
 */
export async function POST(request: NextRequest, { params }: TenantFeaturesRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { brandId } = await params;
    const supabase = await createClient();

    // Vérifier les permissions admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier les permissions admin
    await requireAdmin(user.id);

    const body = await request.json();
    
    // Validation Zod
    const validation = manageTenantFeaturesSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { feature, enabled = true } = validation.data;

    // Récupérer le tenant actuel
    const { data: brand, error: brandError } = await supabase
      .from('Brand')
      .select('id, features')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      if (brandError?.code === 'PGRST116') {
        throw { status: 404, message: 'Tenant non trouvé', code: 'TENANT_NOT_FOUND' };
      }
      logger.dbError('fetch tenant for feature update', brandError, {
        brandId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du tenant' };
    }

    // Parser les fonctionnalités existantes
    let features: Record<string, any> = brand.features || {};
    if (typeof features === 'string') {
      try {
        features = JSON.parse(features);
      } catch (parseError) {
        logger.warn('Failed to parse tenant features JSON', {
          brandId,
          error: parseError,
        });
        features = {};
      }
    }

    // Mettre à jour la fonctionnalité
    features[feature] = enabled;

    // Sauvegarder
    const { data: updatedBrand, error: updateError } = await supabase
      .from('Brand')
      .update({
        features: features,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', brandId)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update tenant features', updateError, {
        brandId,
        userId: user.id,
        feature,
      });
      throw { status: 500, message: 'Erreur lors de la mise à jour des fonctionnalités' };
    }

    logger.info('Tenant feature updated', {
      brandId,
      userId: user.id,
      feature,
      enabled,
    });

    return {
      tenant: {
        id: updatedBrand.id,
        features: features,
      },
      message: `Fonctionnalité ${feature} ${enabled ? 'activée' : 'désactivée'} avec succès`,
    };
  }, '/api/admin/tenants/[brandId]/features', 'POST');
}

/**
 * PUT /api/admin/tenants/[brandId]/features
 * Met à jour plusieurs fonctionnalités à la fois
 */
export async function PUT(request: NextRequest, { params }: TenantFeaturesRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { brandId } = await params;
    const supabase = await createClient();

    // Vérifier les permissions admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier les permissions admin
    await requireAdmin(user.id);

    const body = await request.json();
    const { features } = body;

    // Validation
    if (!features || typeof features !== 'object') {
      throw {
        status: 400,
        message: 'Le paramètre features doit être un objet',
        code: 'VALIDATION_ERROR',
      };
    }

    // Récupérer le tenant actuel
    const { data: brand, error: brandError } = await supabase
      .from('Brand')
      .select('id, features')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      if (brandError?.code === 'PGRST116') {
        throw { status: 404, message: 'Tenant non trouvé', code: 'TENANT_NOT_FOUND' };
      }
      logger.dbError('fetch tenant for features update', brandError, {
        brandId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du tenant' };
    }

    // Parser les fonctionnalités existantes
    let existingFeatures: Record<string, any> = brand.features || {};
    if (typeof existingFeatures === 'string') {
      try {
        existingFeatures = JSON.parse(existingFeatures);
      } catch (parseError) {
        logger.warn('Failed to parse tenant features JSON', {
          brandId,
          error: parseError,
        });
        existingFeatures = {};
      }
    }

    // Fusionner les nouvelles fonctionnalités
    const updatedFeatures = {
      ...existingFeatures,
      ...features,
    };

    // Sauvegarder
    const { data: updatedBrand, error: updateError } = await supabase
      .from('Brand')
      .update({
        features: updatedFeatures,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', brandId)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update tenant features', updateError, {
        brandId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la mise à jour des fonctionnalités' };
    }

    logger.info('Tenant features updated', {
      brandId,
      userId: user.id,
      featuresCount: Object.keys(features).length,
    });

    return {
      tenant: {
        id: updatedBrand.id,
        features: updatedFeatures,
      },
      message: 'Fonctionnalités mises à jour avec succès',
    };
  }, '/api/admin/tenants/[brandId]/features', 'PUT');
}

/**
 * DELETE /api/admin/tenants/[brandId]/features?feature=xxx
 * Désactive/supprime une fonctionnalité pour un tenant
 */
export async function DELETE(request: NextRequest, { params }: TenantFeaturesRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { brandId } = await params;
    const supabase = await createClient();

    // Vérifier les permissions admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier les permissions admin
    await requireAdmin(user.id);

    const { searchParams } = new URL(request.url);
    const feature = searchParams.get('feature');

    if (!feature) {
      throw {
        status: 400,
        message: 'Le paramètre feature est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    // Récupérer le tenant actuel
    const { data: brand, error: brandError } = await supabase
      .from('Brand')
      .select('id, features')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      if (brandError?.code === 'PGRST116') {
        throw { status: 404, message: 'Tenant non trouvé', code: 'TENANT_NOT_FOUND' };
      }
      logger.dbError('fetch tenant for feature deletion', brandError, {
        brandId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du tenant' };
    }

    // Parser les fonctionnalités existantes
    let features: Record<string, any> = brand.features || {};
    if (typeof features === 'string') {
      try {
        features = JSON.parse(features);
      } catch (parseError) {
        logger.warn('Failed to parse tenant features JSON', {
          brandId,
          error: parseError,
        });
        features = {};
      }
    }

    // Supprimer la fonctionnalité
    delete features[feature];

    // Sauvegarder
    const { data: updatedBrand, error: updateError } = await supabase
      .from('Brand')
      .update({
        features: features,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', brandId)
      .select()
      .single();

    if (updateError) {
      logger.dbError('delete tenant feature', updateError, {
        brandId,
        userId: user.id,
        feature,
      });
      throw { status: 500, message: 'Erreur lors de la suppression de la fonctionnalité' };
    }

    logger.info('Tenant feature deleted', {
      brandId,
      userId: user.id,
      feature,
    });

    return {
      tenant: {
        id: updatedBrand.id,
        features: features,
      },
      message: `Fonctionnalité ${feature} supprimée avec succès`,
    };
  }, '/api/admin/tenants/[brandId]/features', 'DELETE');
}
