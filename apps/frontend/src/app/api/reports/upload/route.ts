/**
 * ★★★ API ROUTE - UPLOAD RAPPORTS ★★★
 * API route pour uploader les rapports générés vers le stockage
 * - Support S3/Cloudinary
 * - Validation des fichiers
 * - Retourne l'URL publique
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { deleteFileFromStorage } from '@/lib/storage/storage-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return ApiResponseBuilder.unauthorized('Non authentifié');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return ApiResponseBuilder.badRequest('Aucun fichier fourni');
    }

    // Vérifier le type de fichier (JSON, CSV, PDF uniquement)
    const allowedTypes = ['application/json', 'text/csv', 'application/pdf'];
    const fileType = file.type;
    
    if (!allowedTypes.includes(fileType)) {
      return ApiResponseBuilder.badRequest(
        `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
      );
    }

    // Vérifier la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return ApiResponseBuilder.badRequest('Fichier trop volumineux (max 10MB)');
    }

    logger.info('Upload rapport', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType,
      userId: user.id,
    });

    // Upload vers Supabase Storage
    const fileName = `reports/${user.id}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, file, {
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Error uploading report', {
        error: uploadError,
        userId: user.id,
        fileName: file.name,
      });
      return ApiResponseBuilder.internalError('Erreur lors de l\'upload du rapport');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName);

    logger.info('Rapport uploadé avec succès', {
      fileName: uploadData.path,
      userId: user.id,
      publicUrl,
    });

    return {
      url: publicUrl,
      path: uploadData.path,
      fileName: file.name,
      size: file.size,
      type: fileType,
    };
  }, '/api/reports/upload', 'POST');
}

/**
 * DELETE - Supprime un rapport
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return ApiResponseBuilder.unauthorized('Non authentifié');
    }

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return ApiResponseBuilder.badRequest('URL du fichier manquante');
    }

    // Extract path from URL
    const urlObj = new URL(fileUrl);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/reports\/(.+)/);
    
    if (!pathMatch) {
      return ApiResponseBuilder.badRequest('URL invalide');
    }

    const filePath = pathMatch[1];

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('reports')
      .remove([filePath]);

    if (deleteError) {
      logger.error('Error deleting report', {
        error: deleteError,
        userId: user.id,
        filePath,
      });
      return ApiResponseBuilder.internalError('Erreur lors de la suppression du rapport');
    }

    logger.info('Rapport supprimé avec succès', {
      filePath,
      userId: user.id,
    });

    return { success: true, message: 'Rapport supprimé avec succès' };
  }, '/api/reports/upload', 'DELETE');
}

