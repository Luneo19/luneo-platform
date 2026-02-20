import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import {
  DesignExportStatus,
  DesignExportType,
  Prisma,
} from '@prisma/client';

export const DESIGN_EXPORT_QUEUE = 'design-export';

// ---------------------------------------------------------------------------
// Export options types
// ---------------------------------------------------------------------------

export interface ImageExportOptions {
  format: 'png' | 'jpg' | 'webp';
  quality: number; // 0-100
  width?: number;
  height?: number;
  transparent?: boolean;
  scale?: number; // 1, 2, 3
}

export interface PDFExportOptions {
  pageSize: 'a4' | 'a3' | 'letter' | 'custom';
  orientation: 'portrait' | 'landscape';
  customWidth?: number;
  customHeight?: number;
  includeBleed?: boolean;
  bleedSize?: number;
  includeCropMarks?: boolean;
}

export interface PrintExportOptions extends PDFExportOptions {
  dpi: number;
  colorProfile?: 'srgb' | 'cmyk';
}

export type BatchExportFormat = 'png' | 'jpg' | 'webp' | 'svg' | 'pdf';

export interface ExportRecordResult {
  exportId: string;
  jobId: string;
  status: DesignExportStatus;
}

export interface BatchExportResult extends ExportRecordResult {
  formats: BatchExportFormat[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class DesignExportService {
  private readonly logger = new Logger(DesignExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(DESIGN_EXPORT_QUEUE) private readonly exportQueue: Queue,
  ) {}

  /**
   * Ensures design exists and is accessible; returns design with minimal fields.
   */
  private async getDesignOrThrow(designId: string) {
    const design = await this.prisma.design.findFirst({
      where: {
        id: designId,
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
        canvasWidth: true,
        canvasHeight: true,
        designData: true,
        imageUrl: true,
        highResUrl: true,
      },
    });
    if (!design) {
      throw new NotFoundException(`Design with ID ${designId} not found`);
    }
    return design;
  }

  /**
   * Creates an export record and queues a job for processing.
   * jobPayloadFactory receives exportId so the worker can update the correct record.
   */
  private async createExportAndQueue(
    designId: string,
    userId: string | null,
    type: DesignExportType,
    format: string,
    options: Record<string, unknown>,
    jobName: string,
    jobPayloadFactory: (exportId: string) => Record<string, unknown>,
  ): Promise<ExportRecordResult> {
    const exportRecord = await this.prisma.designExport.create({
      data: {
        designId,
        userId,
        type,
        format,
        status: DesignExportStatus.PENDING,
        options: options as Prisma.InputJsonValue,
        width: (options.width as number) ?? undefined,
        height: (options.height as number) ?? undefined,
        quality: (options.quality as number) ?? undefined,
        dpi: (options.dpi as number) ?? undefined,
      },
    });

    const jobPayload = jobPayloadFactory(exportRecord.id);
    const job = await this.exportQueue.add(jobName, jobPayload, {
      jobId: exportRecord.id,
    });

    await this.prisma.designExport.update({
      where: { id: exportRecord.id },
      data: { jobId: job.id as string },
    });

    this.logger.log(
      `Export queued: ${job.id} (${type}) for design ${designId}, export ${exportRecord.id}`,
    );

    return {
      exportId: exportRecord.id,
      jobId: job.id as string,
      status: DesignExportStatus.PENDING,
    };
  }

  /**
   * Exports design as PNG, JPG or WEBP with configurable quality, dimensions and transparency.
   */
  async exportImage(
    designId: string,
    options: ImageExportOptions,
  ): Promise<ExportRecordResult> {
    await this.getDesignOrThrow(designId);

    const quality = Math.min(100, Math.max(0, options.quality ?? 90));
    const scale = Math.min(3, Math.max(1, options.scale ?? 1));

    return this.createExportAndQueue(
      designId,
      null,
      DesignExportType.IMAGE,
      options.format,
      {
        format: options.format,
        quality,
        width: options.width,
        height: options.height,
        transparent: options.transparent ?? options.format === 'png',
        scale,
      } as Record<string, unknown>,
      'export-image',
      (exportId) => ({
        exportId,
        designId,
        options: {
          format: options.format,
          quality,
          width: options.width,
          height: options.height,
          transparent: options.transparent ?? options.format === 'png',
          scale,
        },
      }),
    );
  }

  /**
   * Exports design as SVG.
   */
  async exportSVG(designId: string): Promise<ExportRecordResult> {
    await this.getDesignOrThrow(designId);

    return this.createExportAndQueue(
      designId,
      null,
      DesignExportType.SVG,
      'svg',
      {},
      'export-svg',
      (exportId) => ({ exportId, designId, options: {} }),
    );
  }

  /**
   * Exports design as PDF with page size, orientation, crop marks and bleed.
   */
  async exportPDF(
    designId: string,
    options: PDFExportOptions,
  ): Promise<ExportRecordResult> {
    await this.getDesignOrThrow(designId);

    if (options.pageSize === 'custom' && (options.customWidth == null || options.customHeight == null)) {
      throw new BadRequestException(
        'customWidth and customHeight are required when pageSize is "custom"',
      );
    }

    const pdfOptions = {
      pageSize: options.pageSize,
      orientation: options.orientation,
      customWidth: options.customWidth,
      customHeight: options.customHeight,
      includeBleed: options.includeBleed ?? false,
      bleedSize: options.bleedSize ?? 0,
      includeCropMarks: options.includeCropMarks ?? false,
    };

    return this.createExportAndQueue(
      designId,
      null,
      DesignExportType.PDF,
      'pdf',
      pdfOptions as Record<string, unknown>,
      'export-pdf',
      (exportId) => ({ exportId, designId, options: pdfOptions }),
    );
  }

  /**
   * Batch export to multiple formats; returns a single job that produces a ZIP.
   */
  async exportBatch(
    designId: string,
    formats: BatchExportFormat[],
  ): Promise<BatchExportResult> {
    if (!formats?.length) {
      throw new BadRequestException('At least one format is required for batch export');
    }
    const allowed: BatchExportFormat[] = ['png', 'jpg', 'webp', 'svg', 'pdf'];
    const invalid = formats.filter((f) => !allowed.includes(f));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Invalid format(s): ${invalid.join(', ')}. Allowed: ${allowed.join(', ')}`,
      );
    }

    await this.getDesignOrThrow(designId);

    const result = await this.createExportAndQueue(
      designId,
      null,
      DesignExportType.BATCH,
      'zip',
      { formats } as Record<string, unknown>,
      'export-batch',
      (exportId) => ({ exportId, designId, options: { formats } }),
    );

    return {
      ...result,
      formats,
    };
  }

  /**
   * Print-ready export: 300 DPI minimum, CMYK hints, 3mm bleed, crop marks.
   */
  async exportForPrint(
    designId: string,
    options: PrintExportOptions,
  ): Promise<ExportRecordResult> {
    await this.getDesignOrThrow(designId);

    const dpi = Math.max(300, options.dpi ?? 300);
    const bleedSize = options.bleedSize ?? 3; // 3mm default

    if (options.pageSize === 'custom' && (options.customWidth == null || options.customHeight == null)) {
      throw new BadRequestException(
        'customWidth and customHeight are required when pageSize is "custom"',
      );
    }

    const printOptions = {
      pageSize: options.pageSize,
      orientation: options.orientation,
      customWidth: options.customWidth,
      customHeight: options.customHeight,
      includeBleed: options.includeBleed ?? true,
      bleedSize,
      includeCropMarks: options.includeCropMarks ?? true,
      dpi,
      colorProfile: options.colorProfile ?? 'cmyk',
    };

    return this.createExportAndQueue(
      designId,
      null,
      DesignExportType.PRINT,
      'pdf',
      printOptions as Record<string, unknown>,
      'export-print',
      (exportId) => ({ exportId, designId, options: printOptions }),
    );
  }

  /**
   * Get status of an export by export id or job id.
   */
  async getExportStatus(exportId: string) {
    const exportRecord = await this.prisma.designExport.findUnique({
      where: { id: exportId },
    });
    if (!exportRecord) {
      throw new NotFoundException(`Export with ID ${exportId} not found`);
    }

    let jobState: string | null = null;
    if (exportRecord.jobId) {
      try {
        const job = await this.exportQueue.getJob(exportRecord.jobId);
        jobState = job ? await job.getState() : null;
      } catch {
        // Job may have been removed from Redis
      }
    }

    return {
      exportId: exportRecord.id,
      designId: exportRecord.designId,
      type: exportRecord.type,
      format: exportRecord.format,
      status: exportRecord.status,
      progress: exportRecord.progress,
      fileUrl: exportRecord.fileUrl,
      fileName: exportRecord.fileName,
      fileSize: exportRecord.fileSize,
      errorMessage: exportRecord.errorMessage,
      jobId: exportRecord.jobId,
      jobState,
      createdAt: exportRecord.createdAt,
      completedAt: exportRecord.completedAt,
    };
  }
}
