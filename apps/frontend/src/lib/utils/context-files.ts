/**
 * ★★★ UTILITIES - CONTEXT FILES ★★★
 * Fonctions utilitaires pour gérer les fichiers contextuels
 * pour le chat/agent
 */

export interface ContextFile {
  id: string;
  fileName: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  description?: string;
  contextId?: string;
}

export interface UploadContextFileResponse {
  file: {
    id: string | null;
    url: string;
    path: string;
    fileName: string;
    size: number;
    type: string;
    uploadedAt: string;
  };
  message: string;
}

/**
 * Upload un fichier contextuel
 */
export async function uploadContextFile(
  file: File,
  contextId?: string,
  description?: string
): Promise<UploadContextFileResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (contextId) {
    formData.append('contextId', contextId);
  }
  if (description) {
    formData.append('description', description);
  }

  const response = await fetch('/api/chat/other-files-context', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
    throw new Error(error.error || error.message || `Erreur ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || data.message || 'Erreur lors de l\'upload');
  }

  return data.data;
}

/**
 * Récupérer les fichiers contextuels
 */
export async function getContextFiles(contextId?: string): Promise<ContextFile[]> {
  const url = contextId
    ? `/api/chat/other-files-context?contextId=${encodeURIComponent(contextId)}`
    : '/api/chat/other-files-context';

  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
    throw new Error(error.error || error.message || `Erreur ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || data.message || 'Erreur lors de la récupération');
  }

  // Convertir les fichiers de la réponse en format ContextFile
  const files = data.data?.files || [];
  return files.map((file: any) => ({
    id: file.id || `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    fileName: file.file_name || file.fileName,
    url: file.file_url || file.url,
    size: file.file_size || file.size,
    type: file.file_type || file.type,
    uploadedAt: file.uploaded_at || file.uploadedAt,
    description: file.description,
    contextId: file.context_id || file.contextId,
  }));
}

/**
 * Supprimer un fichier contextuel
 */
export async function deleteContextFile(fileId?: string, fileUrl?: string): Promise<void> {
  if (!fileId && !fileUrl) {
    throw new Error('ID ou URL du fichier requis');
  }

  const url = fileId
    ? `/api/chat/other-files-context?id=${encodeURIComponent(fileId)}`
    : `/api/chat/other-files-context?url=${encodeURIComponent(fileUrl!)}`;

  const response = await fetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
    throw new Error(error.error || error.message || `Erreur ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || data.message || 'Erreur lors de la suppression');
  }
}

/**
 * Formater la taille d'un fichier
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Obtenir l'icône selon le type de fichier
 */
export function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('text') || fileType.includes('plain')) return '📃';
  if (fileType.includes('json')) return '📋';
  if (fileType.includes('html') || fileType.includes('xml')) return '🌐';
  if (fileType.includes('csv')) return '📈';
  return '📎';
}

/**
 * Interface pour le contenu d'un fichier
 */
export interface ContextFileContent {
  content: string;
  contentType: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

/**
 * Récupérer le contenu textuel d'un fichier contextuel
 * Permet à l'agent/chat d'accéder au contenu pour le contexte
 */
export async function getContextFileContent(
  fileId?: string,
  fileUrl?: string
): Promise<ContextFileContent> {
  if (!fileId && !fileUrl) {
    throw new Error('ID ou URL du fichier requis');
  }

  const url = fileId
    ? `/api/chat/other-files-context/content?id=${encodeURIComponent(fileId)}`
    : `/api/chat/other-files-context/content?url=${encodeURIComponent(fileUrl!)}`;

  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
    throw new Error(error.error || error.message || `Erreur ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || data.message || 'Erreur lors de la récupération du contenu');
  }

  return data.data;
}

/**
 * Récupérer le contenu de tous les fichiers contextuels d'un contexte
 * Utile pour fournir tout le contexte à l'agent
 */
export async function getAllContextFilesContent(contextId?: string): Promise<ContextFileContent[]> {
  const files = await getContextFiles(contextId);
  
  const contents = await Promise.allSettled(
    files.map((file) => getContextFileContent(file.id, file.url))
  );

  return contents
    .filter((result): result is PromiseFulfilledResult<ContextFileContent> => result.status === 'fulfilled')
    .map((result) => result.value);
}

