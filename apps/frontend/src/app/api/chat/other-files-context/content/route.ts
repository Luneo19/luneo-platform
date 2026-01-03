/**
 * ★★★ API ROUTE - CONTEXT FILES CONTENT ★★★
 * API route pour récupérer le contenu textuel des fichiers contextuels
 * Permet à l'agent/chat d'accéder au contenu des fichiers pour le contexte
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Récupère le contenu textuel d'un fichier contextuel
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
    const fileId = searchParams.get('id');
    const fileUrl = searchParams.get('url');

    if (!fileId && !fileUrl) {
      throw {
        status: 400,
        message: 'Le paramètre id ou url est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    // Récupérer les informations du fichier
    let fileInfo: any = null;
    
    if (fileId) {
      try {
        const { data: tableCheck } = await supabase
          .from('context_files')
          .select('id')
          .limit(1);

        if (tableCheck !== null) {
          const { data: file, error: fetchError } = await supabase
            .from('context_files')
            .select('*')
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
            logger.dbError('fetch context file', fetchError, {
              userId: user.id,
              fileId,
            });
            throw {
              status: 500,
              message: 'Erreur lors de la récupération du fichier',
              code: 'DATABASE_ERROR',
            };
          }
          fileInfo = file;
        }
      } catch (dbError: any) {
        if (dbError.status === 404 || dbError.status === 500) {
          throw dbError;
        }
        // La table n'existe peut-être pas, continuer avec l'URL
      }
    }

    // Si on a une URL mais pas d'info, utiliser l'URL directement
    const finalUrl = fileInfo?.file_url || fileUrl;
    
    if (!finalUrl) {
      throw {
        status: 400,
        message: 'URL du fichier manquante',
        code: 'VALIDATION_ERROR',
      };
    }

    // Récupérer le fichier depuis Supabase Storage ou l'URL
    let fileContent: string = '';
    let contentType: string = 'text/plain';

    try {
      // Si c'est une URL Supabase Storage, extraire le chemin
      const urlObj = new URL(finalUrl);
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/other-files\/(.+)/);
      
      if (pathMatch) {
        // Télécharger depuis Supabase Storage
        const filePath = pathMatch[1];
        const { data, error: downloadError } = await supabase.storage
          .from('other-files')
          .download(filePath);

        if (downloadError) {
          logger.error('Error downloading context file', {
            error: downloadError,
            userId: user.id,
            filePath,
          });
          throw {
            status: 500,
            message: 'Erreur lors du téléchargement du fichier',
            code: 'STORAGE_ERROR',
          };
        }

        // Convertir en texte selon le type
        const fileType = fileInfo?.file_type || 'text/plain';
        contentType = fileType;

        if (fileType.includes('text') || fileType.includes('json') || fileType.includes('xml') || fileType.includes('html')) {
          fileContent = await data.text();
        } else if (fileType.includes('pdf')) {
          // Pour les PDF, on retourne une note indiquant qu'il faut un traitement spécial
          fileContent = '[PDF] - Le contenu PDF nécessite un traitement spécial. Utilisez un service d\'extraction PDF.';
        } else if (fileType.includes('word') || fileType.includes('document')) {
          // Pour les documents Word, on retourne une note
          fileContent = '[DOCX] - Le contenu DOCX nécessite un traitement spécial. Utilisez un service d\'extraction DOCX.';
        } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
          // Pour les fichiers Excel, on retourne une note
          fileContent = '[XLSX] - Le contenu XLSX nécessite un traitement spécial. Utilisez un service d\'extraction XLSX.';
        } else {
          // Par défaut, essayer de lire comme texte
          try {
            fileContent = await data.text();
          } catch {
            fileContent = '[BINARY] - Fichier binaire, contenu non lisible en texte.';
          }
        }
      } else {
        // Si c'est une URL externe, faire une requête HTTP
        const response = await fetch(finalUrl);
        if (!response.ok) {
          throw {
            status: 404,
            message: 'Fichier non accessible',
            code: 'FILE_NOT_ACCESSIBLE',
          };
        }
        contentType = response.headers.get('content-type') || 'text/plain';
        fileContent = await response.text();
      }
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      logger.error('Error processing context file content', {
        error,
        userId: user.id,
        fileUrl: finalUrl,
      });
      throw {
        status: 500,
        message: 'Erreur lors du traitement du fichier',
        code: 'PROCESSING_ERROR',
      };
    }

    logger.info('Context file content retrieved', {
      userId: user.id,
      fileId,
      fileUrl: finalUrl,
      contentType,
      contentLength: fileContent.length,
    });

    return {
      content: fileContent,
      contentType,
      fileName: fileInfo?.file_name || 'unknown',
      fileSize: fileInfo?.file_size || fileContent.length,
      uploadedAt: fileInfo?.uploaded_at || new Date().toISOString(),
    };
  }, '/api/chat/other-files-context/content', 'GET');
}



