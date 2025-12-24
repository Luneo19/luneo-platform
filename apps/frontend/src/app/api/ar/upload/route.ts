import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/ar/upload
 * Upload un modèle 3D vers Cloudinary et crée l'entrée dans Supabase
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string || '';
    const designId = formData.get('design_id') as string || null;

    if (!file) {
      throw {
        status: 400,
        message: 'Aucun fichier fourni',
        code: 'VALIDATION_ERROR',
      };
    }

    // Vérifier le format du fichier
    const allowedFormats = ['glb', 'gltf', 'usdz', 'fbx', 'obj'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      throw {
        status: 400,
        message: `Format non supporté. Formats acceptés: ${allowedFormats.join(', ')}`,
        code: 'VALIDATION_ERROR',
      };
    }

    // Vérifier la taille du fichier (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw {
        status: 400,
        message: 'Fichier trop volumineux (max 50MB)',
        code: 'VALIDATION_ERROR',
      };
    }

    logger.info('Upload modèle 3D', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      format: fileExtension,
      userId: user.id,
      designId,
    });

    // Convertir le fichier en Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload vers Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder: `luneo/ar-models/${user.id}`,
      public_id: `model-${Date.now()}`,
      resource_type: 'auto', // Auto-detect resource type
      format: fileExtension,
    });

    // Créer l'entrée dans Supabase
    const { data: arModel, error: dbError } = await supabase
      .from('ar_models')
      .insert({
        user_id: user.id,
        design_id: designId,
        name: name || file.name,
        description,
        model_url: uploadResult.secure_url,
        format: fileExtension,
        file_size: file.size,
        status: 'ready',
        metadata: {
          cloudinary_public_id: uploadResult.public_id,
          uploaded_at: new Date().toISOString(),
        }
      })
      .select()
      .single();

    if (dbError) {
      logger.dbError('create ar model', dbError, {
        userId: user.id,
        designId,
        fileName: file.name,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la sauvegarde du modèle',
        code: 'DATABASE_ERROR',
      };
    }

    logger.info('Modèle 3D uploadé avec succès', {
      arModelId: arModel.id,
      userId: user.id,
      modelUrl: uploadResult.secure_url,
    });

    return {
      model: arModel,
      message: 'Modèle 3D uploadé avec succès',
    };
  }, '/api/ar/upload', 'POST');
}

/**
 * GET /api/ar/upload
 * Liste les modèles 3D de l'utilisateur
 */
export async function GET(_request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer les modèles de l'utilisateur
    const { data: models, error: dbError } = await supabase
      .from('ar_models')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      logger.dbError('fetch ar models', dbError, {
        userId: user.id,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la récupération des modèles',
        code: 'DATABASE_ERROR',
      };
    }

    return { models };
  }, '/api/ar/upload', 'GET');
}
