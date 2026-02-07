import { getUserFromRequest } from '@/lib/auth/get-user';
import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { manageTenantFeaturesSchema } from '@/lib/validation/zod-schemas';
import { logger } from '@/lib/logger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type TenantFeaturesRouteContext = {
  params: Promise<{ brandId: string }>;
};

async function getAdminUser(request: NextRequest): Promise<{ id: string }> {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
  }
  if (user.role !== 'PLATFORM_ADMIN') {
    throw { status: 403, message: 'Accès réservé aux administrateurs', code: 'FORBIDDEN' };
  }
  return user;
}

/**
 * GET /api/admin/tenants/[brandId]/features
 * Récupère les fonctionnalités activées pour un tenant. Cookie-based auth, admin only.
 */
export async function GET(request: NextRequest, { params }: TenantFeaturesRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { brandId } = await params;
    const user = await getAdminUser(request);

    // Forward to backend API
    const cookieHeader = request.headers.get('cookie') || '';
    const response = await fetch(`${API_URL}/api/v1/admin/tenants/${brandId}/features`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la récupération du tenant' }));
      throw {
        status: response.status,
        message: errorData.message || 'Erreur lors de la récupération du tenant',
        code: response.status === 404 ? 'TENANT_NOT_FOUND' : 'FETCH_ERROR',
      };
    }

    const result = await response.json();

    logger.info('Tenant features fetched', {
      brandId,
      userId: user.id,
    });

    return result;
  }, '/api/admin/tenants/[brandId]/features', 'GET');
}

/**
 * POST /api/admin/tenants/[brandId]/features
 * Active une fonctionnalité pour un tenant
 */
export async function POST(request: NextRequest, { params }: TenantFeaturesRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { brandId } = await params;
    const user = await getAdminUser(request);

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

    // Forward to backend API
    const cookieHeader = request.headers.get('cookie') || '';
    const response = await fetch(`${API_URL}/api/v1/admin/tenants/${brandId}/features`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validation.data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la mise à jour des fonctionnalités' }));
      throw {
        status: response.status,
        message: errorData.message || 'Erreur lors de la mise à jour des fonctionnalités',
        code: response.status === 404 ? 'TENANT_NOT_FOUND' : 'UPDATE_ERROR',
      };
    }

    const result = await response.json();

    logger.info('Tenant feature updated', {
      brandId,
      userId: user.id,
      feature: validation.data.feature,
      enabled: validation.data.enabled,
    });

    return result;
  }, '/api/admin/tenants/[brandId]/features', 'POST');
}

/**
 * PUT /api/admin/tenants/[brandId]/features
 * Met à jour plusieurs fonctionnalités à la fois
 */
export async function PUT(request: NextRequest, { params }: TenantFeaturesRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { brandId } = await params;
    const user = await getAdminUser(request);

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

    // Forward to backend API
    const cookieHeader = request.headers.get('cookie') || '';
    const response = await fetch(`${API_URL}/api/v1/admin/tenants/${brandId}/features`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ features }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la mise à jour des fonctionnalités' }));
      throw {
        status: response.status,
        message: errorData.message || 'Erreur lors de la mise à jour des fonctionnalités',
        code: response.status === 404 ? 'TENANT_NOT_FOUND' : 'UPDATE_ERROR',
      };
    }

    const result = await response.json();

    logger.info('Tenant features updated', {
      brandId,
      userId: user.id,
      featuresCount: Object.keys(features).length,
    });

    return result;
  }, '/api/admin/tenants/[brandId]/features', 'PUT');
}

/**
 * DELETE /api/admin/tenants/[brandId]/features?feature=xxx
 * Désactive/supprime une fonctionnalité pour un tenant
 */
export async function DELETE(request: NextRequest, { params }: TenantFeaturesRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { brandId } = await params;
    const user = await getAdminUser(request);

    const { searchParams } = new URL(request.url);
    const feature = searchParams.get('feature');

    if (!feature) {
      throw {
        status: 400,
        message: 'Le paramètre feature est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    // Forward to backend API
    const cookieHeader = request.headers.get('cookie') || '';
    const response = await fetch(`${API_URL}/api/v1/admin/tenants/${brandId}/features?feature=${encodeURIComponent(feature)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la suppression de la fonctionnalité' }));
      throw {
        status: response.status,
        message: errorData.message || 'Erreur lors de la suppression de la fonctionnalité',
        code: response.status === 404 ? 'TENANT_NOT_FOUND' : 'DELETE_ERROR',
      };
    }

    const result = await response.json();

    logger.info('Tenant feature deleted', {
      brandId,
      userId: user.id,
      feature,
    });

    return result;
  }, '/api/admin/tenants/[brandId]/features', 'DELETE');
}
