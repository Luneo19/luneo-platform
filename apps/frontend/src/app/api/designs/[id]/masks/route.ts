import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { v2 as cloudinary } from 'cloudinary';

type DesignMaskRouteContext = {
  params: Promise<{ id: string }>;
};

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/designs/[id]/masks
 * Upload a UV mask PNG and metadata for a design
 */
export async function POST(request: Request, { params }: DesignMaskRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId } = await params;
    const supabase = await createClient();

    // Validate JWT authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Verify design exists and user has access
    const { data: design, error: designError } = await supabase
      .from('designs')
      .select('id, user_id, metadata')
      .eq('id', designId)
      .single();

    if (designError || !design) {
      if (designError?.code === 'PGRST116') {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      logger.dbError('fetch design for mask', designError, {
        designId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du design' };
    }

    if (design.user_id !== user.id) {
      logger.warn('Unauthorized mask upload attempt', {
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
    let metadata: any = {};
    if (metadataJson) {
      try {
        metadata = JSON.parse(metadataJson);
      } catch (parseError) {
        logger.warn('Failed to parse metadata JSON', {
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
      const uploadResult = await new Promise<any>((resolve, reject) => {
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
              else resolve(result);
            }
          )
          .end(buffer);
      });

      maskUrl = uploadResult.secure_url;
    } catch (uploadError: any) {
      logger.error('Cloudinary mask upload error', uploadError, {
        designId,
        userId: user.id,
      });
      throw {
        status: 500,
        message: 'Erreur lors de l\'upload du masque',
        code: 'UPLOAD_ERROR',
      };
    }

    // Store mask metadata in design metadata
    const existingMetadata = (design.metadata as Record<string, unknown>) || {};
    const existingMasks = Array.isArray(existingMetadata.masks) ? existingMetadata.masks : [];

    const { data: updatedDesign, error: updateError } = await supabase
      .from('designs')
      .update({
        metadata: {
          ...existingMetadata,
          masks: [
            ...existingMasks,
            {
              url: maskUrl,
              uploadedAt: new Date().toISOString(),
              metadata: {
                uvBBox: metadata.uvBBox,
                selectedFaceIndices: metadata.selectedFaceIndices,
                textureWidth: metadata.textureWidth,
                textureHeight: metadata.textureHeight,
              },
            },
          ],
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', designId)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update design with mask', updateError, {
        designId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la sauvegarde des métadonnées du masque' };
    }

    logger.info('Design mask uploaded', {
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
