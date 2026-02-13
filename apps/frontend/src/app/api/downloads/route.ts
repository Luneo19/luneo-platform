import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { createDownloadSchema } from '@/lib/validation/zod-schemas';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

/**
 * GET /api/downloads
 * Récupère l'historique des téléchargements. Cookie-based auth, proxies to NestJS.
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    if (!accessToken) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const res = await fetch(`${API_URL}/api/v1/downloads${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw {
        status: res.status,
        message: (err as { message?: string }).message || 'Erreur lors de la récupération des téléchargements',
        code: 'DOWNLOADS_ERROR',
      };
    }
    const data = await res.json();
    const downloads = data.downloads ?? data.data ?? [];
    const pagination = data.pagination ?? {};
    serverLogger.info('Downloads fetched', { count: downloads.length, ...pagination });
    return {
      downloads,
      pagination: {
        page: pagination.page ?? 1,
        limit: pagination.limit ?? 20,
        total: pagination.total ?? downloads.length,
        totalPages: pagination.totalPages ?? 1,
        hasNext: pagination.hasNext ?? false,
        hasPrev: pagination.hasPrev ?? false,
      },
    };
  }, '/api/downloads', 'GET');
}

/**
 * POST /api/downloads
 * Enregistre un téléchargement. Cookie-based auth, proxies to NestJS.
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(createDownloadSchema, request, async (validatedData) => {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    if (!accessToken) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const res = await fetch(`${API_URL}/api/v1/downloads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resourceId: validatedData.resource_id,
        resourceType: validatedData.resource_type,
        fileUrl: validatedData.file_url,
        fileSize: validatedData.file_size,
        format: validatedData.format,
      }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw {
        status: res.status,
        message: (err as { message?: string }).message || 'Erreur lors de l\'enregistrement du téléchargement',
        code: 'DOWNLOAD_CREATE_ERROR',
      };
    }
    const data = await res.json();
    serverLogger.info('Download recorded', { resourceId: validatedData.resource_id, resourceType: validatedData.resource_type });
    return ApiResponseBuilder.success(
      { download: data.download ?? data },
      'Téléchargement enregistré avec succès',
      201
    );
  });
}
