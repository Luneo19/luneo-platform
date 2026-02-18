import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as sharp from 'sharp';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { CUSTOMIZER_QUEUES } from '../visual-customizer.constants';

interface RenderJobData {
  exportId: string;
  canvasData: {
    objects?: Array<{
      type: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
      src?: string;
      text?: string;
      fill?: string;
      stroke?: string;
      [key: string]: unknown;
    }>;
    background?: string;
    width?: number;
    height?: number;
  };
  options: {
    width: number;
    height: number;
    format: 'png' | 'jpeg' | 'webp';
    quality?: number;
  };
}

@Processor(CUSTOMIZER_QUEUES.RENDER)
export class RenderWorker {
  private readonly logger = new Logger(RenderWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  @Process()
  async process(job: Job<RenderJobData>) {
    const { exportId, canvasData, options } = job.data;
    this.logger.log(`Processing render job ${job.id} for export ${exportId}`);

    try {
      // Update export status to PROCESSING
      await this.prisma.customizerExport.update({
        where: { id: exportId },
        data: {
          status: 'PROCESSING',
          startedAt: new Date(),
          progress: 10,
        },
      });

      const width = options.width || canvasData.width || 800;
      const height = options.height || canvasData.height || 800;
      const format = options.format || 'png';
      const quality = options.quality || 90;
      const backgroundColor = canvasData.background || '#ffffff';

      // Create base image with background
      let composite = sharp({
        create: {
          width,
          height,
          channels: 4,
          background: backgroundColor,
        },
      });

      // Process each layer object
      const objects = canvasData.objects || [];
      const svgOverlays: Array<{ input: Buffer; top: number; left: number }> = [];

      for (const obj of objects) {
        try {
          if (obj.type === 'text' && obj.text) {
            // Create SVG text overlay
            const svgText = this.createTextSVG(obj);
            const svgBuffer = Buffer.from(svgText);
            svgOverlays.push({
              input: svgBuffer,
              top: obj.y || 0,
              left: obj.x || 0,
            });
          } else if (obj.type === 'image' && obj.src) {
            // Fetch and composite image
            try {
              const imageResponse = await fetch(obj.src);
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              const imageSharp = sharp(imageBuffer);
              
              // Resize if needed
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
          } else if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'ellipse') {
            // Create SVG shape
            const svgShape = this.createShapeSVG(obj);
            const svgBuffer = Buffer.from(svgShape);
            svgOverlays.push({
              input: svgBuffer,
              top: obj.y || 0,
              left: obj.x || 0,
            });
          }
        } catch (error) {
          this.logger.warn(`Failed to process object ${obj.type}: ${error}`);
        }
      }

      // Update progress
      await this.prisma.customizerExport.update({
        where: { id: exportId },
        data: { progress: 50 },
      });

      // Composite all layers
      if (svgOverlays.length > 0) {
        composite = composite.composite(svgOverlays);
      }

      // Generate final image
      let outputBuffer: Buffer;
      if (format === 'jpeg') {
        outputBuffer = await composite.jpeg({ quality }).toBuffer();
      } else if (format === 'webp') {
        outputBuffer = await composite.webp({ quality }).toBuffer();
      } else {
        outputBuffer = await composite.png().toBuffer();
      }

      // Update progress
      await this.prisma.customizerExport.update({
        where: { id: exportId },
        data: { progress: 80 },
      });

      // Upload to storage
      const fileName = `exports/${exportId}.${format}`;
      const fileUrl = await this.storageService.uploadBuffer(
        outputBuffer,
        fileName,
        {
          contentType: `image/${format}`,
        },
      );

      // Update export record
      await this.prisma.customizerExport.update({
        where: { id: exportId },
        data: {
          status: 'COMPLETED',
          fileUrl,
          fileName: `${exportId}.${format}`,
          fileSize: outputBuffer.length,
          progress: 100,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Render job ${job.id} completed successfully`);
      return { success: true, fileUrl };
    } catch (error) {
      this.logger.error(`Render job ${job.id} failed: ${error}`, error instanceof Error ? error.stack : undefined);

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
    this.logger.log(`Render job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Render job ${job.id} failed: ${error.message}`, error.stack);
  }

  private createTextSVG(obj: {
    text?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    stroke?: string;
  }): string {
    const text = obj.text || '';
    const x = obj.x || 0;
    const y = obj.y || 0;
    const fontSize = obj.fontSize || 24;
    const fontFamily = obj.fontFamily || 'Arial';
    const fill = obj.fill || '#000000';
    const stroke = obj.stroke || 'none';
    const width = obj.width || 200;
    const height = obj.height || fontSize + 10;

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${x}" y="${y + fontSize}" font-family="${fontFamily}" font-size="${fontSize}" fill="${fill}" stroke="${stroke}">
        ${this.escapeXml(text)}
      </text>
    </svg>`;
  }

  private createShapeSVG(obj: {
    type?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fill?: string;
    stroke?: string;
    radius?: number;
  }): string {
    const x = obj.x || 0;
    const y = obj.y || 0;
    const width = obj.width || 100;
    const height = obj.height || 100;
    const fill = obj.fill || '#000000';
    const stroke = obj.stroke || 'none';

    let shapeElement = '';

    if (obj.type === 'rect') {
      shapeElement = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}"/>`;
    } else if (obj.type === 'circle') {
      const radius = obj.radius || Math.min(width, height) / 2;
      shapeElement = `<circle cx="${x + radius}" cy="${y + radius}" r="${radius}" fill="${fill}" stroke="${stroke}"/>`;
    } else if (obj.type === 'ellipse') {
      const rx = width / 2;
      const ry = height / 2;
      shapeElement = `<ellipse cx="${x + rx}" cy="${y + ry}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}"/>`;
    }

    return `<svg width="${width + x}" height="${height + y}" xmlns="http://www.w3.org/2000/svg">
      ${shapeElement}
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
}
