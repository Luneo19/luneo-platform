import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ExportImageDto } from '../dto/export/export-image.dto';
import { ExportPrintDto } from '../dto/export/export-print.dto';
import { CUSTOMIZER_QUEUES } from '../visual-customizer.constants';
import { CurrentUser } from '@/common/types/user.types';

@Injectable()
export class CustomizerExportService {
  private readonly logger = new Logger(CustomizerExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CUSTOMIZER_QUEUES.EXPORT) private readonly exportQueue: Queue,
  ) {}

  /**
   * Export image
   */
  async exportImage(dto: ExportImageDto, user: CurrentUser) {
    // Verify session exists
    const session = await this.prisma.customizerSession.findFirst({
      where: {
        id: dto.sessionId,
        userId: user.id,
      },
      include: {
        customizer: {
          select: {
            id: true,
            canvasWidth: true,
            canvasHeight: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${dto.sessionId} not found`);
    }

    // Create export record
    const exportRecord = await this.prisma.customizerExport.create({
      data: {
        sessionId: dto.sessionId,
        userId: user.id,
        type: 'IMAGE',
        format: dto.format,
        status: 'PENDING',
        width: dto.width || session.customizer.canvasWidth,
        height: dto.height || session.customizer.canvasHeight,
        quality: dto.jpegQuality || (dto.quality === 'HIGH' ? 90 : dto.quality === 'ULTRA' ? 95 : 80),
        options: {
          includeBackground: dto.includeBackground ?? true,
          includeProductImage: dto.includeProductImage ?? true,
          designOnly: dto.designOnly ?? false,
          addWatermark: dto.addWatermark ?? false,
          quality: dto.quality,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    // Queue export job
    const job = await this.exportQueue.add(
      'export-image',
      {
        exportId: exportRecord.id,
        sessionId: dto.sessionId,
        options: {
          format: dto.format,
          width: dto.width,
          height: dto.height,
          quality: dto.quality,
          jpegQuality: dto.jpegQuality,
          includeBackground: dto.includeBackground,
          includeProductImage: dto.includeProductImage,
          designOnly: dto.designOnly,
          addWatermark: dto.addWatermark,
        },
      },
      { jobId: exportRecord.id },
    );

    this.logger.log(`Image export queued: ${job.id} for export ${exportRecord.id}`);

    return {
      exportId: exportRecord.id,
      jobId: job.id as string,
      status: 'PENDING',
    };
  }

  /**
   * Export PDF
   */
  async exportPDF(dto: ExportImageDto, user: CurrentUser) {
    // Verify session exists
    const session = await this.prisma.customizerSession.findFirst({
      where: {
        id: dto.sessionId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${dto.sessionId} not found`);
    }

    // Create export record
    const exportRecord = await this.prisma.customizerExport.create({
      data: {
        sessionId: dto.sessionId,
        userId: user.id,
        type: 'PDF',
        format: 'pdf',
        status: 'PENDING',
        width: dto.width,
        height: dto.height,
        options: {
          includeBackground: dto.includeBackground ?? true,
          includeProductImage: dto.includeProductImage ?? true,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    // Queue PDF export job
    const job = await this.exportQueue.add(
      'export-pdf',
      {
        exportId: exportRecord.id,
        sessionId: dto.sessionId,
        options: {
          width: dto.width,
          height: dto.height,
          includeBackground: dto.includeBackground,
          includeProductImage: dto.includeProductImage,
        },
      },
      { jobId: exportRecord.id },
    );

    this.logger.log(`PDF export queued: ${job.id} for export ${exportRecord.id}`);

    return {
      exportId: exportRecord.id,
      jobId: job.id as string,
      status: 'PENDING',
    };
  }

  /**
   * Export for print
   */
  async exportPrint(dto: ExportPrintDto, user: CurrentUser) {
    // Verify session exists
    const session = await this.prisma.customizerSession.findFirst({
      where: {
        id: dto.sessionId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${dto.sessionId} not found`);
    }

    // Create export record
    const exportRecord = await this.prisma.customizerExport.create({
      data: {
        sessionId: session.id,
        userId: user.id,
        type: 'PRINT',
        format: dto.asPDF ? 'pdf' : dto.format || 'png',
        status: 'PENDING',
        ...(dto.width && { width: dto.width }),
        ...(dto.height && { height: dto.height }),
        dpi: 300, // Print quality
        options: {
          includeBleed: dto.includeBleed ?? false,
          includeCropMarks: dto.includeCropMarks ?? false,
          colorProfile: dto.colorProfile || 'CMYK',
          flattenLayers: dto.flattenLayers ?? false,
          asPDF: dto.asPDF ?? false,
          pdfCompliance: dto.pdfCompliance,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    // Queue print export job
    const job = await this.exportQueue.add(
      'export-print',
      {
        exportId: exportRecord.id,
        sessionId: dto.sessionId,
        options: {
          format: dto.asPDF ? 'pdf' : dto.format,
          width: dto.width,
          height: dto.height,
          includeBleed: dto.includeBleed,
          includeCropMarks: dto.includeCropMarks,
          colorProfile: dto.colorProfile,
          flattenLayers: dto.flattenLayers,
          asPDF: dto.asPDF,
          pdfCompliance: dto.pdfCompliance,
        },
      },
      { jobId: exportRecord.id },
    );

    this.logger.log(`Print export queued: ${job.id} for export ${exportRecord.id}`);

    return {
      exportId: exportRecord.id,
      jobId: job.id as string,
      status: 'PENDING',
    };
  }

  /**
   * Export SVG
   */
  async exportSVG(dto: ExportImageDto, user: CurrentUser) {
    // Verify session exists
    const session = await this.prisma.customizerSession.findFirst({
      where: {
        id: dto.sessionId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${dto.sessionId} not found`);
    }

    // Create export record
    const exportRecord = await this.prisma.customizerExport.create({
      data: {
        sessionId: dto.sessionId,
        userId: user.id,
        type: 'SVG',
        format: 'svg',
        status: 'PENDING',
        width: dto.width,
        height: dto.height,
        options: {
          includeBackground: dto.includeBackground ?? true,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    // Queue SVG export job
    const job = await this.exportQueue.add(
      'export-svg',
      {
        exportId: exportRecord.id,
        sessionId: dto.sessionId,
        options: {
          width: dto.width,
          height: dto.height,
          includeBackground: dto.includeBackground,
        },
      },
      { jobId: exportRecord.id },
    );

    this.logger.log(`SVG export queued: ${job.id} for export ${exportRecord.id}`);

    return {
      exportId: exportRecord.id,
      jobId: job.id as string,
      status: 'PENDING',
    };
  }

  /**
   * Get export status
   */
  async getStatus(jobId: string, user: CurrentUser) {
    const exportRecord = await this.prisma.customizerExport.findFirst({
      where: {
        id: jobId,
        userId: user.id,
      },
    });

    if (!exportRecord) {
      throw new NotFoundException(`Export with ID ${jobId} not found`);
    }

    // Get job status from queue
    const job = await this.exportQueue.getJob(jobId);

    return {
      exportId: exportRecord.id,
      status: exportRecord.status,
      progress: exportRecord.progress,
      fileUrl: exportRecord.fileUrl,
      fileName: exportRecord.fileName,
      fileSize: exportRecord.fileSize,
      errorMessage: exportRecord.errorMessage,
      jobStatus: job ? await job.getState() : null,
    };
  }

  /**
   * Download export file
   */
  async download(jobId: string, user: CurrentUser) {
    const exportRecord = await this.prisma.customizerExport.findFirst({
      where: {
        id: jobId,
        userId: user.id,
        status: 'COMPLETED',
      },
    });

    if (!exportRecord) {
      throw new NotFoundException(
        `Completed export with ID ${jobId} not found`,
      );
    }

    if (!exportRecord.fileUrl) {
      throw new BadRequestException('Export file URL not available');
    }

    return {
      fileUrl: exportRecord.fileUrl,
      fileName: exportRecord.fileName,
      fileSize: exportRecord.fileSize,
      mimeType: this.getMimeType(exportRecord.format),
    };
  }

  /**
   * Get MIME type from format
   */
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      webp: 'image/webp',
      pdf: 'application/pdf',
      svg: 'image/svg+xml',
    };

    return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
  }
}
