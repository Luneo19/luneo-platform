import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * POST /api/library/upload
 * Upload de fichiers dans la bibliothèque
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'image';

    if (!file) {
      throw { status: 400, message: 'Aucun fichier fourni', code: 'MISSING_FILE' };
    }

    // Vérifier la taille (50 MB max)
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      throw { status: 400, message: 'Fichier trop volumineux (max 50 MB)', code: 'FILE_TOO_LARGE' };
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'application/pdf', 'image/vnd.adobe.photoshop', 'application/postscript'];
    if (!allowedTypes.includes(file.type)) {
      throw { status: 400, message: 'Type de fichier non supporté', code: 'INVALID_FILE_TYPE' };
    }

    // Upload vers Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `library/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('library')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Error uploading file to storage', { error: uploadError, userId: user.id });
      throw { status: 500, message: 'Erreur lors de l\'upload', code: 'UPLOAD_ERROR' };
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('library')
      .getPublicUrl(filePath);

    // Enregistrer dans la base de données
    const { data: libraryItem, error: dbError } = await supabase
      .from('library_items')
      .insert({
        user_id: user.id,
        name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_type: type,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Error saving library item to database', { error: dbError, userId: user.id });
      // Nettoyer le fichier uploadé en cas d'erreur DB
      await supabase.storage.from('library').remove([filePath]);
      throw { status: 500, message: 'Erreur lors de l\'enregistrement', code: 'DATABASE_ERROR' };
    }

    logger.info('File uploaded successfully', {
      userId: user.id,
      fileName: file.name,
      fileSize: file.size,
      libraryItemId: libraryItem.id,
    });

    return {
      id: libraryItem.id,
      name: libraryItem.name,
      url: libraryItem.file_url,
      size: libraryItem.file_size,
      type: libraryItem.file_type,
    };
  });
}

