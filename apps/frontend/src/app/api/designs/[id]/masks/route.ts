import { getUserFromRequest } from '@/lib/auth/get-user';
import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { v2 as cloudinary } from 'cloudinary';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

type DesignMaskRouteContext = {
  params: Promise<{ id: string }>;
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/designs/[id]/masks
 * Upload a UV mask PNG and metadata for a design. Cookie-based auth.
 */
export async function POST(request: Request, { params }: DesignMaskRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Forward to backend: verify design exists and user has access
    const designResponse = await fetch(`${API_URL}/api/v1/designs/${designId}`, {
      headers: { Cookie: request.headers.get('cookie') || '' },
    });

    if (!designResponse.ok) {
      if (designResponse.status === 404) {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      serverLogger.error('Failed to fetch design for mask', {
        designId,
        userId: user.id,
        status: designResponse.status,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du design' };
    }

    const design = await designResponse.json();
    if (design.user_id !== user.id) {
      serverLogger.warn('Unauthorized mask upload attempt', {
        designId,
        userId: user.id,
        designOwnerId: design.user_id,
      });
      throw { status: 403, message: 'Accès refusé', code: 'FORBIDDEN' };
    }

    // Parse form data
    const formData = await request.formData();
    const maskFile = formData.get('mask') as File;
    const metadataJson = formData.get('metadata') as string;

    if (!maskFile) {
      throw {
        status: 400,
        message: 'Le fichier masque est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    // Validate file type
    if (!maskFile.type.startsWith('image/')) {
      throw {
        status: 400,
        message: 'Le masque doit être un fichier image',
        code: 'VALIDATION_ERROR',
      };
    }

    // Check size limits (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (maskFile.size > maxSize) {
      throw {
        status: 400,
        message: 'Le fichier masque dépasse la limite de 10MB',
        code: 'VALIDATION_ERROR',
      };
    }

    // Parse metadata
    let metadata: Record<string, unknown> = {};
    if (metadataJson) {
      try {
        metadata = JSON.parse(metadataJson);
      } catch (parseError) {
        serverLogger.warn('Failed to parse metadata JSON', {
          designId,
          userId: user.id,
          error: parseError,
        });
        metadata = {};
      }
    }

    // Convert file to buffer
    const arrayBuffer = await maskFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    let maskUrl: string;
    try {
      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `luneo/designs/${designId}/masks`,
              public_id: `mask-${Date.now()}`,
              resource_type: 'image',
              format: 'png',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result?.secure_url ? { secure_url: result.secure_url } : { secure_url: '' });
            }
          )
          .end(buffer);
      });

      maskUrl = uploadResult.secure_url;
    } catch (uploadError: unknown) {
      serverLogger.error('Cloudinary mask upload error', uploadError, {
        designId,
        userId: user.id,
      });
      throw {
        status: 500,
        message: 'Erreur lors de l\'upload du masque',
        code: 'UPLOAD_ERROR',
      };
    }

    // Forward to backend: store mask metadata in design
    const existingMetadata = (design.metadata as Record<string, unknown>) || {};
    const existingMasks = Array.isArray(existingMetadata.masks) ? existingMetadata.masks : [];

    const updateResponse = await fetch(`${API_URL}/api/v1/designs/${designId}/masks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        maskUrl,
        metadata: {
          uvBBox: metadata.uvBBox,
          selectedFaceIndices: metadata.selectedFaceIndices,
          textureWidth: metadata.textureWidth,
          textureHeight: metadata.textureHeight,
        },
        existingMasks,
      }),
    });

    if (!updateResponse.ok) {
      serverLogger.error('Failed to update design with mask', {
        designId,
        userId: user.id,
        status: updateResponse.status,
      });
      throw { status: 500, message: 'Erreur lors de la sauvegarde des métadonnées du masque' };
    }

    serverLogger.info('Design mask uploaded', {
      designId,
      userId: user.id,
      maskUrl,
    });

    return {
      maskUrl,
      metadata: {
        uvBBox: metadata.uvBBox,
        selectedFaceIndices: metadata.selectedFaceIndices,
        textureWidth: metadata.textureWidth,
        textureHeight: metadata.textureHeight,
      },
    };
  }, '/api/designs/[id]/masks', 'POST');
}
