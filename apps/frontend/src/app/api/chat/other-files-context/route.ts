/**
 * ★★★ API ROUTE - OTHER FILES CONTEXT ★★★
 * API route pour uploader des fichiers contextuels pour le chat/agent
 * - Support de multiples types de fichiers (PDF, TXT, DOCX, etc.)
 * - Validation des fichiers
 * - Stockage via Cloudinary (raw)
 * - Retourne l'URL publique et les métadonnées
 */

import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { v2 as cloudinary } from 'cloudinary';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    const user = await getUserFromRequest(request);
    
    if (!user) {
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

    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const publicId = `chat-context/${user.id}/${timestamp}-${sanitizedFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let publicUrl: string;
    let uploadPath: string;
    try {
      const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `luneo/chat-context/${user.id}`,
              public_id: `${timestamp}-${sanitizedFileName}`,
              resource_type: 'raw',
            },
            (error, result) => {
              if (error) reject(error);
              else if (result) resolve({ secure_url: result.secure_url, public_id: result.public_id ?? '' });
              else reject(new Error('Upload returned no result'));
            }
          )
          .end(buffer);
      });
      publicUrl = uploadResult.secure_url;
      uploadPath = uploadResult.public_id;
    } catch (uploadError) {
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
          storageError: uploadError instanceof Error ? uploadError.message : String(uploadError),
        },
      };
    }

    logger.info('Fichier contextuel uploadé avec succès', {
      fileName: uploadPath,
      userId: user.id,
      publicUrl,
      fileSize: file.size,
    });

    return ApiResponseBuilder.success(
      {
        file: {
          id: null,
          url: publicUrl,
          path: uploadPath,
          fileName,
          size: file.size,
          type: fileType || fileExtension,
          uploadedAt: new Date().toISOString(),
        },
        message: 'Fichier contextuel uploadé avec succès',
      },
      'Fichier contextuel uploadé avec succès'
    );
  }, '/api/chat/other-files-context', 'POST');
}

/**
 * GET - Récupérer les fichiers contextuels de l'utilisateur
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      throw {
        status: 401,
        message: 'Non authentifié',
        code: 'UNAUTHORIZED',
      };
    }

    const { searchParams } = new URL(request.url);
    const contextId = searchParams.get('contextId');

    // Forward to backend API
    const url = new URL(`${API_URL}/api/v1/chat/other-files-context`);
    if (contextId) url.searchParams.set('contextId', contextId);

    const backendResponse = await fetch(url.toString(), {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (!backendResponse.ok) {
      logger.error('Failed to fetch context files', {
        userId: user.id,
        contextId,
        status: backendResponse.status,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la récupération des fichiers',
        code: 'DATABASE_ERROR',
      };
    }

    return await backendResponse.json();
  }, '/api/chat/other-files-context', 'GET');
}

/**
 * DELETE - Supprimer un fichier contextuel
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const user = await getUserFromRequest(request);
    
    if (!user) {
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

    // Forward to backend API
    const url = new URL(`${API_URL}/api/v1/chat/other-files-context`);
    if (fileId) url.searchParams.set('id', fileId);
    if (fileUrl) url.searchParams.set('url', fileUrl);

    const backendResponse = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (!backendResponse.ok) {
      if (backendResponse.status === 404) {
        throw {
          status: 404,
          message: 'Fichier contextuel non trouvé',
          code: 'FILE_NOT_FOUND',
        };
      }
      logger.error('Failed to delete context file', {
        userId: user.id,
        fileId,
        fileUrl,
        status: backendResponse.status,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la suppression du fichier',
        code: 'STORAGE_ERROR',
      };
    }

    const result = await backendResponse.json();
    logger.info('Fichier contextuel supprimé avec succès', {
      userId: user.id,
      fileId,
    });

    return result;
  }, '/api/chat/other-files-context', 'DELETE');
}

