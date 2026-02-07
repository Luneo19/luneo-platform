/**
 * ★★★ SERVICE - PRODUCTION ★★★
 * Service professionnel pour la génération de fichiers production
 * - Export print-ready (CMYK, PDF/X-4)
 * - Export fichiers 3D
 * - Export textures haute résolution
 * - Batch processing
 * - Quality control
 */

import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/cache/CacheService';
import type { ProductionJob } from '@/lib/types/order';
import { endpoints } from '@/lib/api/client';

// AI Engine URL
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || process.env.NEXT_PUBLIC_AI_ENGINE_URL || 'http://localhost:8000';

// ========================================
// TYPES
// ========================================

export interface ProductionFileRequest {
  orderId: string;
  itemId: string;
  format: 'pdf' | 'png' | 'jpg' | 'stl' | 'obj' | 'glb';
  quality?: 'standard' | 'high' | 'print-ready';
  options?: {
    cmyk?: boolean;
    resolution?: number;
    colorProfile?: string;
  };
}

export interface ProductionOptions {
  format: 'pdf' | 'png' | 'jpg' | 'stl' | 'obj' | 'glb';
  quality: 'standard' | 'high' | 'print-ready';
  cmyk?: boolean;
  resolution?: number;
  colorProfile?: string;
  bleed?: number;
  cropMarks?: boolean;
}

export interface ProductionResult {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  files: Array<{
    itemId: string;
    format: string;
    url: string;
    size: number;
    metadata?: Record<string, any>;
  }>;
  error?: string;
}

// ========================================
// SERVICE
// ========================================

export class ProductionService {
  private static instance: ProductionService;

  private constructor() {}

  static getInstance(): ProductionService {
    if (!ProductionService.instance) {
      ProductionService.instance = new ProductionService();
    }
    return ProductionService.instance;
  }

  // ========================================
  // GENERATION
  // ========================================

  /**
   * Génère les fichiers de production pour un item de commande
   */
  async generateFile(
    orderId: string,
    itemId: string,
    options: ProductionOptions
  ): Promise<ProductionResult> {
    try {
      logger.info('Generating production file', {
        orderId,
        itemId,
        format: options.format,
        quality: options.quality,
      });

      const order = await endpoints.orders.get(orderId) as any;

      if (!order) {
        throw new Error('Order not found');
      }

      const items = (order.items ?? []) as Array<{
        id: string;
        designId?: string | null;
        customizationId?: string | null;
      }>;
      const orderItem = items.find((item) => item.id === itemId);
      if (!orderItem) {
        throw new Error('Order item not found');
      }

      // Get design/customization data
      const designId = orderItem.designId;
      if (!designId) {
        throw new Error('Order item has no design');
      }

      const design = await endpoints.designs.get(designId) as any;

      if (!design) {
        throw new Error('Design not found');
      }

      const jobId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Start async job
      this.processProductionJob(jobId, orderId, itemId, options, design).catch((error) => {
        logger.error('Production job failed', { error, jobId });
      });

      return {
        jobId,
        status: 'PENDING',
        progress: 0,
        files: [],
      };
    } catch (error: any) {
      logger.error('Error generating production file', { error, orderId, itemId });
      throw error;
    }
  }

  /**
   * Traite un job de production
   */
  private async processProductionJob(
    jobId: string,
    orderId: string,
    itemId: string,
    options: ProductionOptions,
    design: { highResUrl: string | null; imageUrl: string | null; renderUrl: string | null; metadata: any }
  ): Promise<void> {
    try {
      logger.info('Production job processing', { jobId, orderId, itemId, format: options.format });

      // Store job status in cache (in production, use a job queue like BullMQ)
      cacheService.set(`production:job:${jobId}`, {
        status: 'PROCESSING',
        progress: 0,
      }, { ttl: 3600 * 1000 });

      let fileUrl: string;
      let fileSize: number = 0;

      // 1. Generate file based on format
      if (options.format === 'pdf' || options.format === 'png' || options.format === 'jpg') {
        // 2D image/PDF generation - call AI Engine
        const sourceUrl = design.highResUrl || design.imageUrl || design.renderUrl;
        if (!sourceUrl) {
          throw new Error('No source image found for production');
        }

        // Call AI Engine render endpoint
        const renderResponse = await fetch(`${AI_ENGINE_URL}/api/render`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: sourceUrl,
            format: options.format,
            quality: options.quality,
            cmyk: options.cmyk || false,
            resolution: options.resolution || (options.quality === 'print-ready' ? 300 : 150),
            colorProfile: options.colorProfile || 'sRGB',
            bleed: options.bleed || 0,
            cropMarks: options.cropMarks || false,
          }),
        });

        if (!renderResponse.ok) {
          throw new Error(`AI Engine render failed: ${renderResponse.statusText}`);
        }

        const renderData = await renderResponse.json();
        fileUrl = renderData.url || renderData.fileUrl;
        fileSize = renderData.size || 0;
      } else if (options.format === 'stl' || options.format === 'obj' || options.format === 'glb') {
        // 3D model generation - call AI Engine
        const modelUrl = design.renderUrl || design.highResUrl;
        if (!modelUrl) {
          throw new Error('No 3D model found for production');
        }

        // Call AI Engine export endpoint
        const exportResponse = await fetch(`${AI_ENGINE_URL}/api/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelUrl,
            format: options.format,
            quality: options.quality,
          }),
        });

        if (!exportResponse.ok) {
          throw new Error(`AI Engine export failed: ${exportResponse.statusText}`);
        }

        const exportData = await exportResponse.json();
        fileUrl = exportData.url || exportData.fileUrl;
        fileSize = exportData.size || 0;
      } else {
        throw new Error(`Unsupported format: ${options.format}`);
      }

      // 3. Validate file
      const isValid = await this.validateFile(fileUrl, options.format);
      if (!isValid) {
        throw new Error('Generated file failed validation');
      }

      // 4. Update job status
      cacheService.set(`production:job:${jobId}`, {
        status: 'COMPLETED',
        progress: 100,
        files: [
          {
            itemId,
            format: options.format,
            url: fileUrl,
            size: fileSize,
            metadata: {
              quality: options.quality,
              resolution: options.resolution,
              generatedAt: new Date().toISOString(),
            },
          },
        ],
      }, { ttl: 3600 * 1000 });

      logger.info('Production job completed', { jobId, fileUrl, fileSize });
    } catch (error: any) {
      logger.error('Production job processing failed', { error, jobId });

      // Update job status to failed
      cacheService.set(`production:job:${jobId}`, {
        status: 'FAILED',
        progress: 0,
        error: error.message,
      }, { ttl: 3600 * 1000 });

      throw error;
    }
  }

  // ========================================
  // BATCH PROCESSING
  // ========================================

  /**
   * Génère les fichiers pour tous les items d'une commande
   */
  async generateBatch(
    orderId: string,
    items: Array<{ id: string; format: string; quality: string }>,
    options?: Partial<ProductionOptions>
  ): Promise<ProductionResult> {
    try {
      logger.info('Generating batch production files', {
        orderId,
        itemsCount: items.length,
      });

      const jobId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Process all items
      const promises = items.map((item) =>
        this.generateFile(orderId, item.id, {
          format: item.format as any,
          quality: (item.quality || 'standard') as any,
          ...options,
        })
      );

      const results = await Promise.allSettled(promises);

      const files = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<ProductionResult>).value)
        .flatMap((r) => r.files);

      const errors = results
        .filter((r) => r.status === 'rejected')
        .map((r) => (r as PromiseRejectedResult).reason);

      return {
        jobId,
        status: errors.length === 0 ? 'COMPLETED' : 'PROCESSING',
        progress: 100,
        files,
        error: errors.length > 0 ? errors.map((e) => e.message).join('; ') : undefined,
      };
    } catch (error: any) {
      logger.error('Error generating batch production files', { error, orderId });
      throw error;
    }
  }

  // ========================================
  // STATUS CHECK
  // ========================================

  /**
   * Vérifie le statut d'un job de production
   */
  async checkStatus(jobId: string): Promise<ProductionResult | null> {
    try {
      // Get job status from cache (in production, use job queue like BullMQ)
      const jobStatus = cacheService.get<ProductionResult>(`production:job:${jobId}`);

      if (!jobStatus) {
        return null;
      }

      return jobStatus;
    } catch (error: any) {
      logger.error('Error checking production status', { error, jobId });
      return null;
    }
  }

  // ========================================
  // QUALITY CONTROL
  // ========================================

  /**
   * Vérifie la qualité d'un fichier de production
   */
  async validateFile(fileUrl: string, format: string): Promise<{
    isValid: boolean;
    issues: string[];
    metadata: Record<string, any>;
  }> {
    try {
      logger.info('Validating production file', { fileUrl, format });

      const issues: string[] = [];
      const metadata: Record<string, any> = {};

      // 1. Check file exists and is accessible
      let fileResponse: Response;
      try {
        fileResponse = await fetch(fileUrl, { method: 'HEAD' });
        if (!fileResponse.ok) {
          issues.push(`File not accessible: ${fileResponse.status} ${fileResponse.statusText}`);
          return { isValid: false, issues, metadata };
        }
      } catch (error: any) {
        issues.push(`File fetch failed: ${error.message}`);
        return { isValid: false, issues, metadata };
      }

      // 2. Check file size
      const contentLength = fileResponse.headers.get('content-length');
      if (contentLength) {
        const fileSizeBytes = parseInt(contentLength, 10);
        const fileSizeMB = fileSizeBytes / (1024 * 1024);
        metadata.size = { bytes: fileSizeBytes, mb: fileSizeMB.toFixed(2) };

        // Validate size limits based on format
        const maxSizes: Record<string, number> = {
          pdf: 50, // 50 MB
          png: 20, // 20 MB
          jpg: 10, // 10 MB
          stl: 100, // 100 MB
          obj: 100, // 100 MB
          glb: 50, // 50 MB
        };

        const maxSize = maxSizes[format.toLowerCase()] || 50;
        if (fileSizeMB > maxSize) {
          issues.push(`File size (${fileSizeMB.toFixed(2)} MB) exceeds maximum (${maxSize} MB)`);
        }

        if (fileSizeBytes === 0) {
          issues.push('File is empty');
          return { isValid: false, issues, metadata };
        }
      }

      // 3. Check content type
      const contentType = fileResponse.headers.get('content-type');
      if (contentType) {
        metadata.contentType = contentType;

        const expectedTypes: Record<string, string[]> = {
          pdf: ['application/pdf'],
          png: ['image/png'],
          jpg: ['image/jpeg', 'image/jpg'],
          jpeg: ['image/jpeg', 'image/jpg'],
          stl: ['application/octet-stream', 'model/stl', 'application/sla'],
          obj: ['application/octet-stream', 'model/obj', 'text/plain'],
          glb: ['model/gltf-binary', 'application/octet-stream'],
        };

        const expected = expectedTypes[format.toLowerCase()];
        if (expected && !expected.some((type) => contentType.includes(type))) {
          issues.push(`Content type mismatch: expected ${expected.join(' or ')}, got ${contentType}`);
        }
      }

      // 4. For image formats, check resolution (requires full download)
      if (['png', 'jpg', 'jpeg'].includes(format.toLowerCase())) {
        try {
          const imageResponse = await fetch(fileUrl);
          const arrayBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Use sharp or similar to get image dimensions
          // For now, basic validation
          metadata.downloaded = true;
          metadata.bufferSize = buffer.length;

          // In production, use sharp to get actual dimensions:
          // const sharp = require('sharp');
          // const image = sharp(buffer);
          // const { width, height } = await image.metadata();
          // metadata.dimensions = { width, height };
          // if (width < 100 || height < 100) {
          //   issues.push(`Image resolution too low: ${width}x${height}`);
          // }
        } catch (error: any) {
          issues.push(`Failed to download image for validation: ${error.message}`);
        }
      }

      // 5. For PDF, check if it's valid PDF (basic check)
      if (format.toLowerCase() === 'pdf') {
        try {
          const pdfResponse = await fetch(fileUrl, { headers: { Range: 'bytes=0-4' } });
          const pdfHeader = await pdfResponse.text();
          if (!pdfHeader.startsWith('%PDF')) {
            issues.push('File does not appear to be a valid PDF (missing PDF header)');
          }
        } catch (error: any) {
          issues.push(`Failed to validate PDF header: ${error.message}`);
        }
      }

      // 6. For 3D formats, basic validation
      if (['stl', 'obj', 'glb'].includes(format.toLowerCase())) {
        // In production, use appropriate 3D library to validate
        // For STL: check binary/ASCII header
        // For OBJ: check for vertex data
        // For GLB: check GLB header (0x46546C67)
        metadata.format = format;
        metadata.validated = true;
      }

      const isValid = issues.length === 0;

      logger.info('File validation completed', {
        fileUrl,
        format,
        isValid,
        issuesCount: issues.length,
        metadata,
      });

      return {
        isValid,
        issues,
        metadata,
      };
    } catch (error: any) {
      logger.error('Error validating production file', { error, fileUrl });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const productionService = ProductionService.getInstance();

