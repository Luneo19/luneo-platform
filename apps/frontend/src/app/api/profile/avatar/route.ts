import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/profile/avatar
 * Upload et mise à jour de l'avatar utilisateur
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer le fichier depuis le FormData
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      throw {
        status: 400,
        message: 'Aucun fichier fourni',
        code: 'VALIDATION_ERROR',
      };
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      throw {
        status: 400,
        message: 'Le fichier doit être une image',
        code: 'VALIDATION_ERROR',
      };
    }

    // Vérifier la taille (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw {
        status: 400,
        message: 'L\'image ne doit pas dépasser 2MB',
        code: 'VALIDATION_ERROR',
      };
    }

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload vers Cloudinary
    let uploadResult: any;
    try {
      uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: `luneo/avatars/${user.id}`,
            public_id: `avatar-${Date.now()}`,
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' },
              { quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
    } catch (cloudinaryError: any) {
      logger.error('Cloudinary upload error', cloudinaryError, {
        userId: user.id,
        fileSize: file.size,
        fileType: file.type,
      });
      throw {
        status: 500,
        message: 'Erreur lors de l\'upload vers Cloudinary',
        code: 'CLOUDINARY_ERROR',
      };
    }

    const avatarUrl = uploadResult.secure_url;

    // Mettre à jour le profil avec la nouvelle URL
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update profile avatar', updateError, {
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la mise à jour de l\'avatar' };
    }

    logger.info('Profile avatar updated', {
      userId: user.id,
      avatarUrl,
      fileSize: file.size,
    });

    return {
      profile: updatedProfile,
      avatar_url: avatarUrl,
      message: 'Avatar mis à jour avec succès',
    };
  }, '/api/profile/avatar', 'POST');
}

/**
 * DELETE /api/profile/avatar
 * Supprime l'avatar de l'utilisateur
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Mettre à jour le profil pour supprimer l'avatar
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('delete profile avatar', updateError, {
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la suppression de l\'avatar' };
    }

    logger.info('Profile avatar deleted', {
      userId: user.id,
    });

    return {
      profile: updatedProfile,
      message: 'Avatar supprimé avec succès',
    };
  }, '/api/profile/avatar', 'DELETE');
}
