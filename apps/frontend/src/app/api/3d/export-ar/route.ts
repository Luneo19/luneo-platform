import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { exportARConfigurationSchema } from '@/lib/validation/zod-schemas';
import { z } from 'zod';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(exportARConfigurationSchema, request, async (validatedData) => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const {
      configurationId,
      platform,
      includeTextures = true,
      maxTextureSize = 2048,
      compression = true
    } = validatedData as {
      configurationId: string;
      platform: 'ios' | 'android' | 'web';
      includeTextures?: boolean;
      maxTextureSize?: number;
      compression?: boolean;
    };

    // Get configuration from database
    const { data: configuration, error: configError } = await supabase
      .from('product_3d_configurations')
      .select('*, product_3d_config!inner(*)')
      .eq('id', configurationId)
      .eq('user_id', user.id)
      .single();

    if (configError || !configuration) {
      if (configError?.code === 'PGRST116') {
        throw { status: 404, message: 'Configuration non trouvée', code: 'CONFIGURATION_NOT_FOUND' };
      }
      logger.dbError('fetch configuration for AR export', configError, {
        userId: user.id,
        configurationId,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la récupération de la configuration',
        code: 'DATABASE_ERROR',
      };
    }

    let exportUrl: string;
    let format: string;
    let mimeType: string;

    switch (platform) {
      case 'ios':
        // Export USDZ for iOS AR Quick Look
        format = 'usdz';
        mimeType = 'model/vnd.usdz+zip';
        
        // In production, use actual USDZ conversion
        // For now, reuse GLB as placeholder
        if (configuration.ar_ios_url) {
          exportUrl = configuration.ar_ios_url;
          logger.info('Using cached iOS AR export', {
            userId: user.id,
            configurationId,
            exportUrl,
          });
        } else {
          // Generate USDZ (placeholder - would use actual conversion)
          const usdzBlob = await generateUSDZ(configuration);
          
          const uploadResult = await cloudinary.uploader.upload(
            `data:${mimeType};base64,${Buffer.from(await usdzBlob.arrayBuffer()).toString('base64')}`,
            {
              folder: 'luneo/ar-models',
              public_id: `${configurationId}_ios_${Date.now()}`,
              resource_type: 'raw',
              format: 'usdz',
            }
          );
          
          exportUrl = uploadResult.secure_url;
          
          // Save to configuration
          const { error: updateError } = await supabase
            .from('product_3d_configurations')
            .update({ ar_ios_url: exportUrl })
            .eq('id', configurationId);

          if (updateError) {
            logger.dbError('update configuration with iOS AR URL', updateError, {
              userId: user.id,
              configurationId,
            });
          }

          logger.info('iOS AR export generated', {
            userId: user.id,
            configurationId,
            exportUrl,
          });
        }
        break;

      case 'android':
        // Export GLB for Android Scene Viewer
        format = 'glb';
        mimeType = 'model/gltf-binary';
        
        if (configuration.ar_android_url) {
          exportUrl = configuration.ar_android_url;
          logger.info('Using cached Android AR export', {
            userId: user.id,
            configurationId,
            exportUrl,
          });
        } else {
          // Generate optimized GLB
          const glbBlob = await generateGLB(configuration, { compression, maxTextureSize, includeTextures });
          
          const uploadResult = await cloudinary.uploader.upload(
            `data:${mimeType};base64,${Buffer.from(await glbBlob.arrayBuffer()).toString('base64')}`,
            {
              folder: 'luneo/ar-models',
              public_id: `${configurationId}_android_${Date.now()}`,
              resource_type: 'raw',
              format: 'glb',
            }
          );
          
          exportUrl = uploadResult.secure_url;
          
          // Save to configuration
          const { error: updateError } = await supabase
            .from('product_3d_configurations')
            .update({ ar_android_url: exportUrl })
            .eq('id', configurationId);

          if (updateError) {
            logger.dbError('update configuration with Android AR URL', updateError, {
              userId: user.id,
              configurationId,
            });
          }

          logger.info('Android AR export generated', {
            userId: user.id,
            configurationId,
            exportUrl,
          });
        }
        break;

      case 'web': {
        // Export GLB for WebXR
        format = 'glb';
        mimeType = 'model/gltf-binary';
        
        const glbBlob = await generateGLB(configuration, {
          compression: false,
          maxTextureSize: 4096,
          includeTextures
        });
        
        const uploadResult = await cloudinary.uploader.upload(
          `data:${mimeType};base64,${Buffer.from(await glbBlob.arrayBuffer()).toString('base64')}`,
          {
            folder: 'luneo/ar-models',
            public_id: `${configurationId}_web_${Date.now()}`,
            resource_type: 'raw',
            format: 'glb',
          }
        );
        
        exportUrl = uploadResult.secure_url;

        logger.info('Web AR export generated', {
          userId: user.id,
          configurationId,
          exportUrl,
        });
        break;
      }

      default:
        throw {
          status: 400,
          message: 'Plateforme non supportée',
          code: 'VALIDATION_ERROR',
        };
    }

    // Generate AR Quick Look/Scene Viewer links
    const arLinks = generateARLinks(exportUrl, platform, configuration.configuration_name);

    return ApiResponseBuilder.success({
      exportUrl,
      platform,
      format,
      mimeType,
      arLinks,
      fileSize: 'Unknown', // Would be actual file size in production
    });
  });
}

async function generateUSDZ(configuration: any): Promise<Blob> {
  // Placeholder - in production, convert GLB to USDZ using proper converter
  // This would use tools like:
  // - usdz-converter npm package
  // - Reality Converter API
  // - Server-side conversion with USD Python bindings

  const configurationName = configuration?.configuration_name ?? 'Configuration';
  const placeholderContent = `USDZ placeholder for ${configurationName}`;
  return new Blob([placeholderContent], { type: 'model/vnd.usdz+zip' });
}

async function generateGLB(
  configuration: any,
  options: { compression?: boolean; maxTextureSize?: number; includeTextures?: boolean }
): Promise<Blob> {
  // Placeholder - in production, use Three.js server-side rendering to generate optimized GLB
  // This would:
  // 1. Load base model
  // 2. Apply materials/colors/parts from configuration
  // 3. Add text engraving if present
  // 4. Optimize (compress geometry, resize textures)
  // 5. Export to GLB format

  const { compression = false, maxTextureSize = 2048, includeTextures = true } = options;
  const summary = JSON.stringify(
    {
      compression,
      maxTextureSize,
      includeTextures,
      configurationName: configuration?.configuration_name ?? 'Configuration'
    },
    null,
    2
  );

  return new Blob([`GLB placeholder\n${summary}`], { type: 'model/gltf-binary' });
}

function generateARLinks(modelUrl: string, platform: string, title: string): any {
  const links: any = {};

  if (platform === 'ios') {
    // iOS AR Quick Look link
    links.quickLook = `<a rel="ar" href="${modelUrl}">
      <img src="/ar-icon-ios.png" alt="View in AR on iOS">
    </a>`;
    
    links.directLink = modelUrl;
  }

  if (platform === 'android') {
    // Android Scene Viewer intent
    const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_preferred&title=${encodeURIComponent(title)}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(modelUrl)};end;`;
    
    links.sceneViewer = intentUrl;
    links.directLink = modelUrl;
  }

  if (platform === 'web') {
    // WebXR compatible link
    links.webxr = `/ar/viewer?model=${encodeURIComponent(modelUrl)}`;
    links.directLink = modelUrl;
  }

  // QR Code for easy mobile access
  links.qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(modelUrl)}`;

  return links;
}

export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const configurationId = searchParams.get('id');

    // Validation Zod pour le paramètre id
    const idValidation = z.string().uuid('ID de configuration invalide').safeParse(configurationId);

    if (!idValidation.success) {
      throw {
        status: 400,
        message: 'Le paramètre id est requis et doit être un UUID valide',
        code: 'VALIDATION_ERROR',
        details: idValidation.error.issues,
      };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Get AR URLs for configuration
    const { data: configuration, error } = await supabase
      .from('product_3d_configurations')
      .select('ar_ios_url, ar_android_url, configuration_name')
      .eq('id', idValidation.data)
      .eq('user_id', user.id)
      .single();

    if (error || !configuration) {
      if (error?.code === 'PGRST116') {
        throw { status: 404, message: 'Configuration non trouvée', code: 'CONFIGURATION_NOT_FOUND' };
      }
      logger.dbError('fetch AR exports for configuration', error, {
        userId: user.id,
        configurationId: idValidation.data,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la récupération des exports AR',
        code: 'DATABASE_ERROR',
      };
    }

    return ApiResponseBuilder.success({
      ios: configuration.ar_ios_url ? {
        url: configuration.ar_ios_url,
        format: 'usdz',
        links: generateARLinks(configuration.ar_ios_url, 'ios', configuration.configuration_name),
      } : null,
      android: configuration.ar_android_url ? {
        url: configuration.ar_android_url,
        format: 'glb',
        links: generateARLinks(configuration.ar_android_url, 'android', configuration.configuration_name),
      } : null,
    });
  }, '/api/3d/export-ar', 'GET');
}
