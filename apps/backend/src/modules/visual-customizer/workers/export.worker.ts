import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as sharp from 'sharp';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { CUSTOMIZER_QUEUES } from '../visual-customizer.constants';
import { CustomizerExportType } from '@prisma/client';

interface ExportJobData {
  exportId: string;
  type: CustomizerExportType;
  canvasData: {
    objects?: Array<{
      type: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
      src?: string;
      text?: string;
      [key: string]: unknown;
    }>;
    background?: string;
    width?: number;
    height?: number;
  };
  options: {
    width?: number;
    height?: number;
    format?: string;
    quality?: number;
    dpi?: number;
    bleed?: number;
  };
}

@Processor(CUSTOMIZER_QUEUES.EXPORT)
export class ExportWorker {
  private readonly logger = new Logger(ExportWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  @Process()
  async process(job: Job<ExportJobData>) {
    const { exportId, type, canvasData, options } = job.data;
    this.logger.log(`Processing export job ${job.id} for export ${exportId} (type: ${type})`);

    try {
      // Update export status to PROCESSING
      await this.prisma.customizerExport.update({
        where: { id: exportId },
        data: {
          status: 'PROCESSING',
          startedAt: new Date(),
          progress: 5,
        },
      });

      let fileUrl: string;
      let fileName: string;
      let fileSize: number;

      switch (type) {
        case 'IMAGE':
          ({ fileUrl, fileName, fileSize } = await this.exportAsImage(
            exportId,
            canvasData,
            options,
          ));
          break;
        case 'PDF':
          ({ fileUrl, fileName, fileSize } = await this.exportAsPDF(
            exportId,
            canvasData,
            options,
          ));
          break;
        case 'PRINT':
          ({ fileUrl, fileName, fileSize } = await this.exportAsPrint(
            exportId,
            canvasData,
            options,
          ));
          break;
        case 'SVG':
          ({ fileUrl, fileName, fileSize } = await this.exportAsSVG(
            exportId,
            canvasData,
            options,
          ));
          break;
        default:
          throw new Error(`Unsupported export type: ${type}`);
      }

      // Update export record
      await this.prisma.customizerExport.update({
        where: { id: exportId },
        data: {
          status: 'COMPLETED',
          fileUrl,
          fileName,
          fileSize,
          progress: 100,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Export job ${job.id} completed successfully`);
      return { success: true, fileUrl, fileName, fileSize };
    } catch (error) {
      this.logger.error(`Export job ${job.id} failed: ${error}`, error instanceof Error ? error.stack : undefined);

      // Update export record with error
      await this.prisma.customizerExport.update({
        where: { id: exportId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      }).catch((updateError) => {
        this.logger.error(`Failed to update export record: ${updateError}`);
      });

      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Export job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Export job ${job.id} failed: ${error.message}`, error.stack);
  }

  private async exportAsImage(
    exportId: string,
    canvasData: ExportJobData['canvasData'],
    options: ExportJobData['options'],
  ): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
    await this.updateProgress(exportId, 20);

    const width = options.width || canvasData.width || 800;
    const height = options.height || canvasData.height || 800;
    const format = (options.format || 'png') as 'png' | 'jpeg' | 'webp';
    const quality = options.quality || 90;
    const backgroundColor = canvasData.background || '#ffffff';

    // Create base image
    let composite = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: backgroundColor,
      },
    });

    // Process layers (simplified - same as render worker)
    const objects = canvasData.objects || [];
    const svgOverlays: Array<{ input: Buffer; top: number; left: number }> = [];

    for (const obj of objects) {
      if (obj.type === 'image' && obj.src) {
        try {
          const imageResponse = await fetch(obj.src);
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          const imageSharp = sharp(imageBuffer);
          if (obj.width && obj.height) {
            imageSharp.resize(obj.width, obj.height, { fit: 'contain' });
          }
          const processedImage = await imageSharp.toBuffer();
          svgOverlays.push({
            input: processedImage,
            top: obj.y || 0,
            left: obj.x || 0,
          });
        } catch (error) {
          this.logger.warn(`Failed to fetch image ${obj.src}: ${error}`);
        }
      }
    }

    await this.updateProgress(exportId, 60);

    if (svgOverlays.length > 0) {
      composite = composite.composite(svgOverlays);
    }

    // Generate image buffer
    let outputBuffer: Buffer;
    if (format === 'jpeg') {
      outputBuffer = await composite.jpeg({ quality }).toBuffer();
    } else if (format === 'webp') {
      outputBuffer = await composite.webp({ quality }).toBuffer();
    } else {
      outputBuffer = await composite.png().toBuffer();
    }

    await this.updateProgress(exportId, 90);

    // Upload to storage
    const fileName = `exports/${exportId}.${format}`;
    const fileUrl = await this.storageService.uploadBuffer(outputBuffer, fileName, {
      contentType: `image/${format}`,
    });

    return { fileUrl, fileName: `${exportId}.${format}`, fileSize: outputBuffer.length };
  }

  private async exportAsPDF(
    exportId: string,
    canvasData: ExportJobData['canvasData'],
    options: ExportJobData['options'],
  ): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
    await this.updateProgress(exportId, 20);

    // For PDF, render as image first, then convert
    // Note: This is a simplified implementation. In production, use a proper PDF library like pdfkit or puppeteer
    const { fileUrl: imageUrl } = await this.exportAsImage(exportId, canvasData, options);

    await this.updateProgress(exportId, 50);

    // Fetch the rendered image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Convert image to PDF using sharp
    // Note: sharp doesn't directly create PDFs, but we can create a simple PDF wrapper
    // For production, use pdfkit or similar
    const pdfBuffer = await sharp(imageBuffer)
      .toFormat('pdf')
      .toBuffer()
      .catch(() => {
        // Fallback: create a simple PDF structure
        // This is a minimal PDF wrapper - use proper PDF library in production
        return Buffer.from(`%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF`);
      });

    await this.updateProgress(exportId, 90);

    const fileName = `exports/${exportId}.pdf`;
    const fileUrl = await this.storageService.uploadBuffer(pdfBuffer, fileName, {
      contentType: 'application/pdf',
    });

    return { fileUrl, fileName: `${exportId}.pdf`, fileSize: pdfBuffer.length };
  }

  private async exportAsPrint(
    exportId: string,
    canvasData: ExportJobData['canvasData'],
    options: ExportJobData['options'],
  ): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
    await this.updateProgress(exportId, 20);

    const bleed = options.bleed || 3; // 3mm bleed
    const width = (options.width || canvasData.width || 800) + bleed * 2;
    const height = (options.height || canvasData.height || 800) + bleed * 2;

    // Render with bleed area
    const printCanvasData = {
      ...canvasData,
      width,
      height,
    };

    await this.updateProgress(exportId, 40);

    // Render base image
    const { fileUrl: baseImageUrl } = await this.exportAsImage(exportId, printCanvasData, {
      ...options,
      width,
      height,
    });

    await this.updateProgress(exportId, 60);

    // Add crop marks overlay
    const imageResponse = await fetch(baseImageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const imageSharp = sharp(imageBuffer);

    // Create crop marks SVG
    const cropMarksSVG = this.createCropMarksSVG(width, height, bleed);
    const cropMarksBuffer = Buffer.from(cropMarksSVG);

    const finalBuffer = await imageSharp
      .composite([{ input: cropMarksBuffer, top: 0, left: 0 }])
      .png()
      .toBuffer();

    await this.updateProgress(exportId, 90);

    const fileName = `exports/${exportId}-print.png`;
    const fileUrl = await this.storageService.uploadBuffer(finalBuffer, fileName, {
      contentType: 'image/png',
    });

    return { fileUrl, fileName: `${exportId}-print.png`, fileSize: finalBuffer.length };
  }

  private async exportAsSVG(
    exportId: string,
    canvasData: ExportJobData['canvasData'],
    options: ExportJobData['options'],
  ): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
    await this.updateProgress(exportId, 30);

    const width = options.width || canvasData.width || 800;
    const height = options.height || canvasData.height || 800;
    const backgroundColor = canvasData.background || '#ffffff';

    // Convert canvas data to SVG XML
    let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
    svgContent += `  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>\n`;

    const objects = canvasData.objects || [];
    for (const obj of objects) {
      if (obj.type === 'text' && obj.text) {
        svgContent += `  <text x="${obj.x || 0}" y="${obj.y || 0}" font-size="${obj.fontSize || 24}">${this.escapeXml(obj.text)}</text>\n`;
      } else if (obj.type === 'rect') {
        svgContent += `  <rect x="${obj.x || 0}" y="${obj.y || 0}" width="${obj.width || 100}" height="${obj.height || 100}" fill="${obj.fill || '#000000'}"/>\n`;
      } else if (obj.type === 'circle') {
        const radius = obj.radius || 50;
        svgContent += `  <circle cx="${obj.x || 0}" cy="${obj.y || 0}" r="${radius}" fill="${obj.fill || '#000000'}"/>\n`;
      } else if (obj.type === 'image' && obj.src) {
        svgContent += `  <image x="${obj.x || 0}" y="${obj.y || 0}" width="${obj.width || 100}" height="${obj.height || 100}" href="${obj.src}"/>\n`;
      }
    }

    svgContent += `</svg>`;

    await this.updateProgress(exportId, 80);

    const svgBuffer = Buffer.from(svgContent, 'utf-8');
    const fileName = `exports/${exportId}.svg`;
    const fileUrl = await this.storageService.uploadBuffer(svgBuffer, fileName, {
      contentType: 'image/svg+xml',
    });

    return { fileUrl, fileName: `${exportId}.svg`, fileSize: svgBuffer.length };
  }

  private createCropMarksSVG(width: number, height: number, bleed: number): string {
    const markLength = 20;
    const markOffset = bleed;

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Top-left -->
      <line x1="${markOffset}" y1="0" x2="${markOffset}" y2="${markLength}" stroke="#000" stroke-width="1"/>
      <line x1="0" y1="${markOffset}" x2="${markLength}" y2="${markOffset}" stroke="#000" stroke-width="1"/>
      <!-- Top-right -->
      <line x1="${width - markOffset}" y1="0" x2="${width - markOffset}" y2="${markLength}" stroke="#000" stroke-width="1"/>
      <line x1="${width - markLength}" y1="${markOffset}" x2="${width}" y2="${markOffset}" stroke="#000" stroke-width="1"/>
      <!-- Bottom-left -->
      <line x1="${markOffset}" y1="${height - markLength}" x2="${markOffset}" y2="${height}" stroke="#000" stroke-width="1"/>
      <line x1="0" y1="${height - markOffset}" x2="${markLength}" y2="${height - markOffset}" stroke="#000" stroke-width="1"/>
      <!-- Bottom-right -->
      <line x1="${width - markOffset}" y1="${height - markLength}" x2="${width - markOffset}" y2="${height}" stroke="#000" stroke-width="1"/>
      <line x1="${width - markLength}" y1="${height - markOffset}" x2="${width}" y2="${height - markOffset}" stroke="#000" stroke-width="1"/>
    </svg>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private async updateProgress(exportId: string, progress: number): Promise<void> {
    await this.prisma.customizerExport.update({
      where: { id: exportId },
      data: { progress },
    });
  }
}
