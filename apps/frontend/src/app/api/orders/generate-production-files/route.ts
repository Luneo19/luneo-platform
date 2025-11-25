/**
 * /api/orders/generate-production-files/route.ts
 *
 * API endpoint to generate all production-ready files for an order
 * Generates PDF/X-4, DXF, PNG, and other print files
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { generateProductionFilesSchema } from '@/lib/validation/zod-schemas';
import { createClient } from '@/lib/supabase/server';
import { PrintReadyGenerator } from '@/lib/print-automation/PrintReadyGenerator';
import { PDFX4Exporter, PrintSpecs } from '@/lib/print-automation/PDFX4Exporter';
import { DXFExporter } from '@/lib/print-automation/DXFExporter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ProductionFilesRequest {
  orderId: string;
  designId: string;
  includeFormats?: ('pdf' | 'dxf' | 'png' | 'svg')[];
  printSpecs?: PrintSpecs;
}

interface ProductionFilesResponse {
  success: boolean;
  orderId: string;
  files: {
    pdf?: {
      url: string;
      fileSize: number;
      format: 'PDF/X-4';
    };
    dxf?: {
      url: string;
      fileSize: number;
      format: 'DXF R2018';
    };
    png?: {
      url: string;
      fileSize: number;
      resolution: string;
    };
    svg?: {
      url: string;
      fileSize: number;
      format: 'SVG';
    };
  };
  metadata: {
    generatedAt: string;
    totalFiles: number;
    totalSize: number;
    printSpecs: PrintSpecs;
  };
  errors?: string[];
}

/**
 * POST /api/orders/generate-production-files
 * Generate all production-ready files for an order
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Parse request body
    const body: ProductionFilesRequest = await request.json();

    // Validation Zod
    const validation = generateProductionFilesSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { orderId, designId, format = 'pdf', quality = 'high' } = validation.data;
    const { includeFormats = [format] } = body as ProductionFilesRequest;

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      if (orderError?.code === 'PGRST116') {
        throw { status: 404, message: 'Commande non trouvée', code: 'ORDER_NOT_FOUND' };
      }
      logger.dbError('fetch order for production files', orderError, {
        orderId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération de la commande' };
    }

    // Fetch design details
    const { data: design, error: designError } = await supabase
      .from('custom_designs')
      .select('*')
      .eq('id', designId)
      .eq('user_id', user.id)
      .single();

    if (designError || !design) {
      if (designError?.code === 'PGRST116') {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      logger.dbError('fetch design for production files', designError, {
        designId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du design' };
    }

    // Initialize generators
    const printReadyGenerator = new PrintReadyGenerator();
    const pdfExporter = new PDFX4Exporter();
    const dxfExporter = new DXFExporter();

    const files: ProductionFilesResponse['files'] = {};
    const errors: string[] = [];
    let totalSize = 0;

    // Get design data (canvas data URL or base64)
    const designData = design.design_data?.canvas || design.preview_url;
    if (!designData) {
      throw {
        status: 400,
        message: 'Données de design non trouvées',
        code: 'VALIDATION_ERROR',
      };
    }

    // Extract print specs from body
    const { printSpecs } = body;
    
    // Default print specs if not provided
    const defaultPrintSpecs: PrintSpecs = printSpecs || pdfExporter.getStandardPrintSpecs('flyer');

    // Generate PDF/X-4
    if (includeFormats.includes('pdf')) {
      try {
        const pdfResult = await pdfExporter.generatePDFX4(designData, defaultPrintSpecs);

        if (pdfResult.success && pdfResult.pdfBase64) {
          const pdfUrl = await uploadToStorage(
            pdfResult.pdfBase64,
            `orders/${orderId}/production-files/${designId}.pdf`,
            'application/pdf'
          );

          files.pdf = {
            url: pdfUrl,
            fileSize: pdfResult.fileSize,
            format: 'PDF/X-4',
          };
          totalSize += pdfResult.fileSize;
        } else {
          errors.push(...(pdfResult.errors || ['Échec de la génération PDF']));
        }
      } catch (error: any) {
        logger.error('PDF generation error', error, {
          orderId,
          designId,
          userId: user.id,
        });
        errors.push(`Erreur génération PDF: ${error.message || 'Erreur inconnue'}`);
      }
    }

    // Generate DXF (for laser cutting)
    if (includeFormats.includes('dxf')) {
      try {
        const dxfResult = dxfExporter.convertKonvaToDXF(design.design_data);

        if (dxfResult.success && dxfResult.dxfContent) {
          const dxfUrl = await uploadToStorage(
            Buffer.from(dxfResult.dxfContent).toString('base64'),
            `orders/${orderId}/production-files/${designId}.dxf`,
            'application/dxf'
          );

          files.dxf = {
            url: dxfUrl,
            fileSize: dxfResult.fileSize,
            format: 'DXF R2018',
          };
          totalSize += dxfResult.fileSize;
        } else {
          errors.push(...(dxfResult.errors || ['Échec de la génération DXF']));
        }
      } catch (error: any) {
        logger.error('DXF generation error', error, {
          orderId,
          designId,
          userId: user.id,
        });
        errors.push(`Erreur génération DXF: ${error.message || 'Erreur inconnue'}`);
      }
    }

    // Generate high-res PNG
    if (includeFormats.includes('png')) {
      try {
        const pngResult = await printReadyGenerator.generatePNG(designData, {
          width: defaultPrintSpecs.dimensions.width,
          height: defaultPrintSpecs.dimensions.height,
          dpi: defaultPrintSpecs.resolution,
        });

        if (pngResult.success && pngResult.imageData) {
          const pngUrl = await uploadToStorage(
            pngResult.imageData.toString('base64'),
            `orders/${orderId}/production-files/${designId}.png`,
            'image/png'
          );

          files.png = {
            url: pngUrl,
            fileSize: pngResult.fileSize || 0,
            resolution: `${defaultPrintSpecs.resolution} DPI`,
          };
          totalSize += pngResult.fileSize || 0;
        } else {
          errors.push(pngResult.error || 'Échec de la génération PNG');
        }
      } catch (error: any) {
        logger.error('PNG generation error', error, {
          orderId,
          designId,
          userId: user.id,
        });
        errors.push(`Erreur génération PNG: ${error.message || 'Erreur inconnue'}`);
      }
    }

    // Generate SVG (vector)
    if (includeFormats.includes('svg')) {
      try {
        const svgResult = await printReadyGenerator.generateSVG(design.design_data);

        if (svgResult.success && svgResult.svgContent) {
          const svgUrl = await uploadToStorage(
            Buffer.from(svgResult.svgContent).toString('base64'),
            `orders/${orderId}/production-files/${designId}.svg`,
            'image/svg+xml'
          );

          files.svg = {
            url: svgUrl,
            fileSize: svgResult.fileSize || 0,
            format: 'SVG',
          };
          totalSize += svgResult.fileSize || 0;
        } else {
          errors.push(svgResult.error || 'Échec de la génération SVG');
        }
      } catch (error: any) {
        logger.error('SVG generation error', error, {
          orderId,
          designId,
          userId: user.id,
        });
        errors.push(`Erreur génération SVG: ${error.message || 'Erreur inconnue'}`);
      }
    }

    // Update order with production files
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        print_files: files,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      logger.dbError('update order with production files', updateError, {
        orderId,
        userId: user.id,
      });
      // Ne pas échouer complètement si la mise à jour échoue
    }

    // Log production files generation
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'production_files_generated',
        resource_type: 'order',
        resource_id: orderId,
        metadata: {
          designId,
          formats: includeFormats,
          totalFiles: Object.keys(files).length,
          totalSize,
        },
      });

    if (logError) {
      logger.warn('Failed to log production files generation', {
        orderId,
        userId: user.id,
        error: logError,
      });
    }

    logger.info('Production files generated', {
      orderId,
      designId,
      userId: user.id,
      totalFiles: Object.keys(files).length,
      totalSize,
      errors: errors.length,
    });

    const response: ProductionFilesResponse = {
      success: errors.length === 0,
      orderId,
      files,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalFiles: Object.keys(files).length,
        totalSize,
        printSpecs: defaultPrintSpecs,
      },
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    // Retourner avec status 207 si des erreurs partielles
    if (errors.length > 0 && Object.keys(files).length > 0) {
      // Utiliser ApiResponseBuilder.success avec status personnalisé
      return ApiResponseBuilder.success(response, undefined, 207);
    }

    return response;
  }, '/api/orders/generate-production-files', 'POST');
}

/**
 * GET /api/orders/generate-production-files?orderId=xxx
 * Get production files status for an order
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      throw {
        status: 400,
        message: 'Le paramètre orderId est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    // Fetch order with production files
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, print_files, status, updated_at')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      if (orderError?.code === 'PGRST116') {
        throw { status: 404, message: 'Commande non trouvée', code: 'ORDER_NOT_FOUND' };
      }
      logger.dbError('fetch order production files', orderError, {
        orderId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération de la commande' };
    }

    return {
      orderId: order.id,
      status: order.status,
      printFiles: order.print_files || {},
      hasProductionFiles: !!order.print_files && Object.keys(order.print_files).length > 0,
      lastUpdated: order.updated_at,
    };
  }, '/api/orders/generate-production-files', 'GET');
}

/**
 * DELETE /api/orders/generate-production-files?orderId=xxx
 * Delete production files for an order
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      throw {
        status: 400,
        message: 'Le paramètre orderId est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, print_files')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      if (orderError?.code === 'PGRST116') {
        throw { status: 404, message: 'Commande non trouvée', code: 'ORDER_NOT_FOUND' };
      }
      logger.dbError('fetch order for deletion', orderError, {
        orderId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération de la commande' };
    }

    // Delete files from storage
    if (order.print_files) {
      try {
        const { deleteFiles } = await import('@/lib/storage');
        const filesToDelete = Array.isArray(order.print_files) 
          ? order.print_files 
          : [order.print_files];
        
        const deleteResults = await deleteFiles(filesToDelete, 'auto');
        
        const failedDeletes = deleteResults.filter(r => !r.success);
        if (failedDeletes.length > 0) {
          logger.warn('Some files failed to delete', {
            orderId,
            failedCount: failedDeletes.length,
            totalCount: filesToDelete.length,
          });
        } else {
          logger.info('Production files deleted successfully', {
            orderId,
            fileCount: filesToDelete.length,
          });
        }
      } catch (deleteError) {
        // Log error but don't fail the request
        logger.error('Error deleting production files', deleteError instanceof Error ? deleteError : new Error(String(deleteError)), {
          orderId,
          userId: user.id,
        });
      }
    }

    // Clear production files from order
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        print_files: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      logger.dbError('delete production files from order', updateError, {
        orderId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la suppression des fichiers' };
    }

    // Log deletion
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'production_files_deleted',
        resource_type: 'order',
        resource_id: orderId,
      });

    if (logError) {
      logger.warn('Failed to log production files deletion', {
        orderId,
        userId: user.id,
        error: logError,
      });
    }

    logger.info('Production files deleted', {
      orderId,
      userId: user.id,
    });

    return { message: 'Fichiers de production supprimés avec succès' };
  }, '/api/orders/generate-production-files', 'DELETE');
}

/**
 * Upload file to storage (Cloudinary or S3)
 * Utilise le service de stockage centralisé
 */
async function uploadToStorage(
  base64Data: string,
  path: string,
  mimeType: string
): Promise<string> {
  const { uploadFile } = await import('@/lib/storage');
  
  try {
    const result = await uploadFile(
      base64Data,
      path,
      mimeType,
      'auto', // Auto-detect provider (Cloudinary or S3)
      {
        folder: 'luneo/orders/production-files',
        resourceType: mimeType.startsWith('image/') ? 'image' : 'raw',
        overwrite: true,
        invalidate: true,
        tags: ['production-file', 'order'],
      }
    );

    return result.secureUrl;
  } catch (error) {
    logger.error('Upload to storage error', error instanceof Error ? error : new Error(String(error)), {
      path,
      mimeType,
    });
    throw new Error('Échec de l\'upload du fichier vers le stockage');
  }
}
