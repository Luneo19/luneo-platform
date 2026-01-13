import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/rbac';

/**
 * GET /api/admin/tenants
 * Récupère tous les tenants (brands) - Admin seulement
 */
export async function GET(_request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    // Check admin permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier les permissions admin
    await requireAdmin(user.id);

    // Fetch all brands (tenants)
    const { data: brands, error: brandsError } = await supabase
      .from('Brand')
      .select('id, name, plan, status')
      .order('createdAt', { ascending: false });

    if (brandsError) {
      logger.dbError('fetch tenants', brandsError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération des tenants' };
    }

    // Transform to tenant format
    const tenants = (brands || []).map((brand: any) => ({
      id: brand.id,
      name: brand.name || 'Unnamed Tenant',
      plan: brand.plan || 'starter',
      status: brand.status || 'active',
    }));

    logger.info('Tenants fetched', {
      userId: user.id,
      count: tenants.length,
    });

    return { tenants };
  }, '/api/admin/tenants', 'GET');
}
