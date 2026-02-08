import { getUserFromRequest } from '@/lib/auth/get-user';
import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { saveCustomDesignSchema, updateCustomDesignSchema } from '@/lib/validation/zod-schemas';
import { z } from 'zod';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

/**
 * POST /api/designs/save-custom
 * Sauvegarde un design personnalisé. Cookie-based auth.
 * Forwards to backend API /api/v1/designs/custom
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(saveCustomDesignSchema, request, async (validatedData) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Forward to backend API
    const cookieHeader = request.headers.get('cookie') || '';
    const response = await fetch(`${API_URL}/api/v1/designs/custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la sauvegarde du design' }));
      throw { status: response.status, message: errorData.message || 'Erreur lors de la sauvegarde du design' };
    }

    const createdDesign = await response.json();

    logger.info('Custom design saved', {
      userId: user.id,
      designId: createdDesign.id,
      designName: validatedData.name,
    });

    return ApiResponseBuilder.success(
      {
        design: createdDesign,
      },
      'Design personnalisé sauvegardé avec succès',
      201
    );
  });
}

/**
 * PUT /api/designs/save-custom?id=xxx
 * Met à jour un design personnalisé
 * Forwards to backend API /api/v1/designs/custom/[id]
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(updateCustomDesignSchema, request, async (validatedData) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('id');

    const idValidation = z.string().uuid('ID de design invalide').safeParse(designId);

    if (!idValidation.success) {
      throw {
        status: 400,
        message: 'Le paramètre id est requis et doit être un UUID valide',
        code: 'VALIDATION_ERROR',
        details: idValidation.error.issues,
      };
    }

    // Forward to backend API
    const cookieHeader = request.headers.get('cookie') || '';
    const response = await fetch(`${API_URL}/api/v1/designs/custom/${idValidation.data}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur lors de la mise à jour du design' }));
      throw {
        status: response.status,
        message: errorData.message || 'Erreur lors de la mise à jour du design',
        code: response.status === 404 ? 'DESIGN_NOT_FOUND' : 'UPDATE_ERROR',
      };
    }

    const updatedDesign = await response.json();

    logger.info('Custom design updated', {
      designId: idValidation.data,
      userId: user.id,
    });

    return ApiResponseBuilder.success(
      {
        design: updatedDesign,
      },
      'Design personnalisé mis à jour avec succès'
    );
  });
}
