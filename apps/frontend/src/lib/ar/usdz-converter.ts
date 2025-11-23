/**
 * USDZ Converter Service
 * Convertit GLB vers USDZ pour iOS AR Quick Look
 * 
 * Options:
 * 1. Service externe (CloudConvert, ModelConverter)
 * 2. Conversion côté serveur avec usdz-converter
 * 3. Utiliser API Apple (si disponible)
 */

import { logger } from '@/lib/logger';

export interface USDZConversionOptions {
  optimize?: boolean;
  includeTextures?: boolean;
  compressionLevel?: 'low' | 'medium' | 'high';
}

export interface USDZConversionResult {
  success: boolean;
  usdzUrl?: string;
  fileSize?: number;
  error?: string;
}

/**
 * Convertir GLB vers USDZ
 * 
 * Pour MVP: Utiliser CloudConvert API ou service similaire
 * Pour production: Implémenter conversion côté serveur avec usdz-converter
 */
export async function convertGLBToUSDZ(
  glbUrl: string,
  options: USDZConversionOptions = {}
): Promise<USDZConversionResult> {
  const { optimize = true, includeTextures = true, compressionLevel = 'medium' } = options;

  try {
    logger.info('Starting GLB to USDZ conversion', {
      glbUrl,
      optimize,
      includeTextures,
      compressionLevel,
    });

    // Option 1: Utiliser CloudConvert API (recommandé pour MVP)
    if (process.env.CLOUDCONVERT_API_KEY) {
      return await convertWithCloudConvert(glbUrl, options);
    }

    // Option 2: Utiliser service interne (route API existante)
    // Toujours essayer d'abord le service interne (plus rapide et gratuit)
    try {
      return await convertWithInternalService(glbUrl, options);
    } catch (internalError) {
      logger.warn('Internal USDZ conversion failed, trying CloudConvert', internalError);
      // Fallback sur CloudConvert si service interne échoue
      if (process.env.CLOUDCONVERT_API_KEY) {
        return await convertWithCloudConvert(glbUrl, options);
      }
      throw internalError;
    }

    // Option 3: Fallback - retourner erreur avec message clair
    logger.warn('USDZ conversion not configured', {
      glbUrl,
      hasCloudConvert: !!process.env.CLOUDCONVERT_API_KEY,
      hasInternalConverter: process.env.USDZ_CONVERTER_ENABLED === 'true',
    });

    return {
      success: false,
      error: 'USDZ conversion not configured. Please configure CloudConvert API key or enable internal converter.',
    };
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('USDZ conversion failed', errorObj, { glbUrl, options });
    
    return {
      success: false,
      error: errorObj.message || 'Unknown conversion error',
    };
  }
}

/**
 * Conversion avec CloudConvert API
 */
async function convertWithCloudConvert(
  glbUrl: string,
  options: USDZConversionOptions
): Promise<USDZConversionResult> {
  try {
    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) {
      throw new Error('CloudConvert API key not configured');
    }

    // Créer job de conversion
    const jobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks: {
          'import-glb': {
            operation: 'import/url',
            url: glbUrl,
          },
          'convert-usdz': {
            operation: 'convert',
            input: 'import-glb',
            output_format: 'usdz',
            options: {
              optimize: options.optimize,
              include_textures: options.includeTextures,
            },
          },
          'export-usdz': {
            operation: 'export/url',
            input: 'convert-usdz',
          },
        },
      }),
    });

    if (!jobResponse.ok) {
      const errorData = await jobResponse.json();
      throw new Error(`CloudConvert API error: ${JSON.stringify(errorData)}`);
    }

    const jobData = await jobResponse.json();
    const jobId = jobData.data.id;

    // Attendre la fin de la conversion (polling)
    let usdzUrl: string | undefined;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Attendre 5 secondes

      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      const statusData = await statusResponse.json();
      const task = statusData.data.tasks?.find((t: { name: string }) => t.name === 'export-usdz');

      if (task?.status === 'finished') {
        usdzUrl = task.result?.files?.[0]?.url;
        break;
      }

      if (task?.status === 'error') {
        throw new Error(`Conversion failed: ${task.message}`);
      }

      attempts++;
    }

    if (!usdzUrl) {
      throw new Error('Conversion timeout - USDZ file not generated');
    }

    // Récupérer la taille du fichier
    const fileInfoResponse = await fetch(usdzUrl, { method: 'HEAD' });
    const fileSize = parseInt(fileInfoResponse.headers.get('content-length') || '0', 10);

    logger.info('USDZ conversion completed', {
      glbUrl,
      usdzUrl,
      fileSize,
    });

    return {
      success: true,
      usdzUrl,
      fileSize,
    };
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('CloudConvert conversion failed', errorObj, { glbUrl });
    throw errorObj;
  }
}

/**
 * Conversion avec service interne (usdz-converter)
 * Utilise la route API existante /api/ar/convert-usdz
 */
async function convertWithInternalService(
  glbUrl: string,
  options: USDZConversionOptions
): Promise<USDZConversionResult> {
  try {
    // Appeler endpoint interne de conversion existant
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/ar/convert-usdz`
      : '/api/ar/convert-usdz';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        glb_url: glbUrl,
        optimize: options.optimize,
        product_name: 'AR Model',
        scale: 1.0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Conversion failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      usdzUrl: result.usdz_url,
      fileSize: result.file_size || 0,
    };
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Internal USDZ conversion failed', errorObj, { glbUrl });
    throw errorObj;
  }
}

