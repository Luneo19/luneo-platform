import fs from 'fs/promises';
import path from 'path';

interface SaveOptions {
  contentType?: string;
  metadata?: Record<string, unknown>;
}

interface SaveResult {
  url: string;
  path: string;
  size: number;
  contentType?: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_ROOT =
  process.env.WORKER_STORAGE_PATH ?? path.join(process.cwd(), 'storage');

/**
 * Sauvegarde un buffer dans le stockage local (ou dossier configuré).
 * En production, ce helper pourra être remplacé par une solution S3/R2.
 */
export async function saveToStorage(
  buffer: Buffer,
  relativePath: string,
  options: SaveOptions = {}
): Promise<SaveResult> {
  const safeRelativePath = relativePath.replace(/^\/+/, '');
  const absolutePath = path.join(STORAGE_ROOT, safeRelativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  const urlBase =
    process.env.WORKER_STORAGE_BASE_URL ?? 'http://localhost:4000/storage';

  return {
    url: `${urlBase}/${safeRelativePath}`.replace(/\\/g, '/'),
    path: absolutePath,
    size: buffer.byteLength,
    contentType: options.contentType,
    metadata: options.metadata,
  };
}


