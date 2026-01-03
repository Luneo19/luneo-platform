/**
 * ★★★ API ROUTE - OTHER FILES CONTEXT ★★★
 * API route pour uploader des fichiers contextuels pour le chat/agent
 * - Support de multiples types de fichiers (PDF, TXT, DOCX, etc.)
 * - Validation des fichiers
 * - Retourne l'URL publique et les métadonnées
 * 
 * ⚠️ IMPORTANT: Créer le bucket Supabase "other-files" dans le dashboard Supabase
 *    si ce bucket n'existe pas encore. Le bucket doit être public ou configuré
 *    avec les bonnes politiques RLS (Row Level Security).
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

// Types de fichiers autorisés pour le contexte
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv',
  'application/json',
  'text/html',
  'application/xml',
  'text/xml',
];

// Extensions de fichiers autorisées (fallback)
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.txt',
  '.md',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.csv',
  '.json',
  '.html',
  '.xml',
];

// Taille maximale : 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * POST - Upload un fichier contextuel
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw {
        status: 401,
        message: 'Non authentifié',
        code: 'UNAUTHORIZED',
      };
    }

    // Parser le FormData
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      throw {
        status: 400,
        message: 'Erreur lors du parsing du FormData',
        code: 'INVALID_FORM_DATA',
      };
    }

    const file = formData.get('file') as File;
    const contextId = formData.get('contextId') as string | null;
    const description = formData.get('description') as string | null;

    // Validation du fichier
    if (!file) {
      throw {
        status: 400,
        message: 'Aucun fichier fourni',
        code: 'VALIDATION_ERROR',
      };
    }

    // Vérifier le type de fichier
    const fileType = file.type;
    const fileName = file.name;
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    // Vérifier le type MIME
    const isValidMimeType = fileType && ALLOWED_FILE_TYPES.includes(fileType);
    // Vérifier l'extension (fallback si le type MIME n'est pas détecté)
    const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);

    if (!isValidMimeType && !isValidExtension) {
      throw {
        status: 400,
        message: `Type de fichier non autorisé. Types acceptés: ${ALLOWED_FILE_TYPES.join(', ')} ou extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
        code: 'VALIDATION_ERROR',
        metadata: {
          fileType,
          fileExtension,
          allowedTypes: ALLOWED_FILE_TYPES,
          allowedExtensions: ALLOWED_EXTENSIONS,
        },
      };
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      throw {
        status: 400,
        message: `Fichier trop volumineux. Taille maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        code: 'VALIDATION_ERROR',
        metadata: {
          fileSize: file.size,
          maxSize: MAX_FILE_SIZE,
        },
      };
    }

    // Vérifier que le fichier n'est pas vide
    if (file.size === 0) {
      throw {
        status: 400,
        message: 'Le fichier est vide',
        code: 'VALIDATION_ERROR',
      };
    }

    logger.info('Upload fichier contextuel', {
      fileName,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType,
      fileExtension,
      userId: user.id,
      contextId,
    });

    // Upload vers Supabase Storage
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageFileName = `chat-context/${user.id}/${timestamp}-${sanitizedFileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('other-files')
      .upload(storageFileName, file, {
        contentType: fileType || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Error uploading context file', {
        error: uploadError,
        userId: user.id,
        fileName,
        fileSize: file.size,
      });
      throw {
        status: 500,
        message: 'Erreur lors de l\'upload du fichier',
        code: 'STORAGE_ERROR',
        metadata: {
          storageError: uploadError.message,
        },
      };
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('other-files')
      .getPublicUrl(storageFileName);

    // Optionnel : Créer une entrée dans la base de données pour le suivi
    // (Si vous avez une table pour les fichiers contextuels)
    let dbRecord = null;
    try {
      // Vérifier si la table existe avant d'insérer
      const { data: tableCheck } = await supabase
        .from('context_files')
        .select('id')
        .limit(1);

      if (tableCheck !== null) {
        // La table existe, on peut insérer
        const { data: insertedData, error: insertError } = await supabase
          .from('context_files')
          .insert({
            user_id: user.id,
            file_name: fileName,
            file_url: publicUrl,
            file_path: storageFileName,
            file_size: file.size,
            file_type: fileType || fileExtension,
            context_id: contextId || null,
            description: description || null,
            uploaded_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          // Logger l'erreur mais ne pas faire échouer l'upload
          logger.warn('Error creating context file database record', {
            error: insertError,
            userId: user.id,
            fileName,
          });
        } else {
          dbRecord = insertedData;
        }
      }
    } catch (dbError) {
      // La table n'existe peut-être pas, ce n'est pas grave
      logger.warn('Context files table may not exist', {
        error: dbError,
        userId: user.id,
      });
    }

    logger.info('Fichier contextuel uploadé avec succès', {
      fileName: uploadData.path,
      userId: user.id,
      publicUrl,
      fileSize: file.size,
    });

    return {
      file: {
        id: dbRecord?.id || null,
        url: publicUrl,
        path: uploadData.path,
        fileName,
        size: file.size,
        type: fileType || fileExtension,
        uploadedAt: new Date().toISOString(),
      },
      message: 'Fichier contextuel uploadé avec succès',
    };
  }, '/api/chat/other-files-context', 'POST');
}

/**
 * GET - Récupérer les fichiers contextuels de l'utilisateur
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw {
        status: 401,
        message: 'Non authentifié',
        code: 'UNAUTHORIZED',
      };
    }

    const { searchParams } = new URL(request.url);
    const contextId = searchParams.get('contextId');

    // Essayer de récupérer depuis la base de données
    try {
      const { data: tableCheck } = await supabase
        .from('context_files')
        .select('id')
        .limit(1);

      if (tableCheck !== null) {
        // La table existe
        let query = supabase
          .from('context_files')
          .select('*')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false });

        if (contextId) {
          query = query.eq('context_id', contextId);
        }

        const { data: files, error: fetchError } = await query;

        if (fetchError) {
          logger.dbError('fetch context files', fetchError, {
            userId: user.id,
            contextId,
          });
          throw {
            status: 500,
            message: 'Erreur lors de la récupération des fichiers',
            code: 'DATABASE_ERROR',
          };
        }

        return {
          files: files || [],
          count: files?.length || 0,
        };
      }
    } catch (dbError) {
      // La table n'existe peut-être pas
      logger.warn('Context files table may not exist', {
        error: dbError,
        userId: user.id,
      });
    }

    // Si la table n'existe pas, retourner une liste vide
    return {
      files: [],
      count: 0,
      message: 'Aucun fichier contextuel trouvé',
    };
  }, '/api/chat/other-files-context', 'GET');
}

/**
 * DELETE - Supprimer un fichier contextuel
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw {
        status: 401,
        message: 'Non authentifié',
        code: 'UNAUTHORIZED',
      };
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const fileUrl = searchParams.get('url');

    if (!fileId && !fileUrl) {
      throw {
        status: 400,
        message: 'Le paramètre id ou url est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    let filePath: string | null = null;

    // Si on a un ID, récupérer depuis la base de données
    if (fileId) {
      try {
        const { data: tableCheck } = await supabase
          .from('context_files')
          .select('id')
          .limit(1);

        if (tableCheck !== null) {
          const { data: file, error: fetchError } = await supabase
            .from('context_files')
            .select('file_path, file_url')
            .eq('id', fileId)
            .eq('user_id', user.id)
            .single();

          if (fetchError) {
            if (fetchError.code === 'PGRST116') {
              throw {
                status: 404,
                message: 'Fichier contextuel non trouvé',
                code: 'FILE_NOT_FOUND',
              };
            }
            logger.dbError('fetch context file for deletion', fetchError, {
              userId: user.id,
              fileId,
            });
            throw {
              status: 500,
              message: 'Erreur lors de la récupération du fichier',
              code: 'DATABASE_ERROR',
            };
          }

          filePath = file?.file_path || null;

          // Supprimer de la base de données
          const { error: deleteError } = await supabase
            .from('context_files')
            .delete()
            .eq('id', fileId)
            .eq('user_id', user.id);

          if (deleteError) {
            logger.dbError('delete context file', deleteError, {
              userId: user.id,
              fileId,
            });
            // Continuer avec la suppression du fichier même si la DB échoue
          }
        }
      } catch (dbError: any) {
        if (dbError.status === 404 || dbError.status === 500) {
          throw dbError;
        }
        // La table n'existe peut-être pas, continuer avec la suppression du fichier
        logger.warn('Context files table may not exist', {
          error: dbError,
          userId: user.id,
        });
      }
    }

    // Si on a une URL mais pas de filePath, extraire le chemin
    if (!filePath && fileUrl) {
      const urlObj = new URL(fileUrl);
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/other-files\/(.+)/);
      
      if (pathMatch) {
        filePath = pathMatch[1];
      } else {
        // Essayer un autre format d'URL
        const altMatch = urlObj.pathname.match(/other-files\/(.+)/);
        if (altMatch) {
          filePath = altMatch[1];
        }
      }
    }

    // Supprimer le fichier du storage
    if (filePath) {
      const { error: deleteError } = await supabase.storage
        .from('other-files')
        .remove([filePath]);

      if (deleteError) {
        logger.error('Error deleting context file from storage', {
          error: deleteError,
          userId: user.id,
          fileId,
          filePath,
        });
        throw {
          status: 500,
          message: 'Erreur lors de la suppression du fichier',
          code: 'STORAGE_ERROR',
        };
      }
    } else {
      logger.warn('Could not determine file path for deletion', {
        userId: user.id,
        fileId,
        fileUrl,
      });
    }

    logger.info('Fichier contextuel supprimé avec succès', {
      filePath,
      userId: user.id,
      fileId,
    });

    return {
      message: 'Fichier contextuel supprimé avec succès',
    };
  }, '/api/chat/other-files-context', 'DELETE');
}

