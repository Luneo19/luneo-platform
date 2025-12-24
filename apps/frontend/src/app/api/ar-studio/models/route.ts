import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function GET(_request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { data: models, error } = await supabase
      .from('ar_models')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.dbError('fetch ar models', error, { userId: user.id });
      throw {
        status: 500,
        message: 'Erreur lors de la récupération des modèles AR',
        code: 'DATABASE_ERROR',
      };
    }

    return { models: models || [] };
  }, '/api/ar-studio/models', 'GET');
}

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;

    if (!file || !name) {
      throw {
        status: 400,
        message: 'Champs requis manquants: file et name',
        code: 'VALIDATION_ERROR',
      };
    }

    // Upload file to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('ar-models')
      .upload(fileName, file);

    if (uploadError) {
      logger.error('Error uploading AR model file', {
        error: uploadError,
        userId: user.id,
        fileName: file.name,
        fileSize: file.size,
      });
      throw {
        status: 500,
        message: 'Erreur lors de l\'upload du fichier',
        code: 'STORAGE_ERROR',
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('ar-models')
      .getPublicUrl(fileName);

    // Create database record
    const { data, error } = await supabase
      .from('ar_models')
      .insert({
        user_id: user.id,
        name,
        type,
        file_url: publicUrl,
        file_size: file.size,
        status: 'processing'
      })
      .select()
      .single();

    if (error) {
      logger.dbError('create ar model', error, {
        userId: user.id,
        name,
        type,
        fileName: file.name,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la création du modèle AR',
        code: 'DATABASE_ERROR',
      };
    }

    logger.info('AR model uploaded successfully', {
      userId: user.id,
      modelId: data.id,
      name,
      type,
      fileSize: file.size,
    });

    return {
      model: data,
      message: 'Modèle AR uploadé avec succès',
    };
  }, '/api/ar-studio/models', 'POST');
}

export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('id');

    if (!modelId) {
      throw {
        status: 400,
        message: 'Le paramètre id est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    // Get model to delete file
    const { data: model, error: fetchError } = await supabase
      .from('ar_models')
      .select('file_url')
      .eq('id', modelId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw { status: 404, message: 'Modèle AR non trouvé', code: 'MODEL_NOT_FOUND' };
      }
      logger.dbError('fetch ar model for deletion', fetchError, {
        userId: user.id,
        modelId,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la récupération du modèle',
        code: 'DATABASE_ERROR',
      };
    }

    if (model?.file_url) {
      // Delete file from storage
      const filePath = model.file_url.split('/ar-models/')[1];
      const { error: deleteError } = await supabase.storage
        .from('ar-models')
        .remove([filePath]);

      if (deleteError) {
        logger.error('Error deleting AR model file from storage', {
          error: deleteError,
          userId: user.id,
          modelId,
          filePath,
        });
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete database record
    const { error } = await supabase
      .from('ar_models')
      .delete()
      .eq('id', modelId)
      .eq('user_id', user.id);

    if (error) {
      logger.dbError('delete ar model', error, {
        userId: user.id,
        modelId,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la suppression du modèle',
        code: 'DATABASE_ERROR',
      };
    }

    logger.info('AR model deleted successfully', {
      userId: user.id,
      modelId,
    });

    return {
      message: 'Modèle AR supprimé avec succès',
    };
  }, '/api/ar-studio/models', 'DELETE');
}
