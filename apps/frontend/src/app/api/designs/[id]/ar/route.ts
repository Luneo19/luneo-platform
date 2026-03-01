import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { ApiResponseBuilder } from '@/lib/api-response';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

type DesignARRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/designs/[id]/ar
 * Récupère les informations AR pour un design. Cookie-based auth, proxies to NestJS.
 */
export async function GET(request: NextRequest, { params }: DesignARRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    if (!accessToken) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const res = await fetch(`${API_URL}/api/v1/designs/${designId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      if (res.status === 404) throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      if (res.status === 403) throw { status: 403, message: 'Accès refusé', code: 'FORBIDDEN' };
      throw { status: res.status, message: 'Erreur lors de la récupération du design', code: 'DESIGN_ERROR' };
    }
    const design = await res.json();
    const meta = design.metadata || {};
    return {
      designId: design.id,
      arModelUrl: design.arModelUrl ?? design.ar_model_url ?? meta.ar_model_url,
      arPreviewUrl: design.arPreviewUrl ?? design.ar_preview_url ?? meta.ar_preview_url,
      previewUrl: design.previewUrl ?? design.preview_url,
      metadata: meta,
    };
  }, '/api/designs/[id]/ar', 'GET');
}
