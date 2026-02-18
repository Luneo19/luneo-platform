import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { ExportType, ExportStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { get as httpsGet } from 'https';
import { get as httpGet } from 'http';

export interface ExportOptions {
  format?: string;
  quality?: number;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

@Injectable()
export class Configurator3DExportService {
  private readonly logger = new Logger(Configurator3DExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('configurator-3d-export-pdf') private readonly pdfQueue: Queue,
    @InjectQueue('configurator-3d-export-3d') private readonly export3DQueue: Queue,
  ) {}

  async exportPDF(
    configurationId: string,
    sessionId: string | null,
    userId: string,
    options?: ExportOptions,
  ): Promise<{ jobId: string; exportId: string }> {
    const config = await this.prisma.configurator3DConfiguration.findUnique({
      where: { id: configurationId },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configurationId} not found`,
      );
    }

    const exportRecord = await this.prisma.configurator3DExport.create({
      data: {
        configurationId,
        sessionId,
        userId,
        type: ExportType.PDF,
        format: options?.format ?? 'a4',
        status: ExportStatus.PENDING,
        options: (options || {}) as object,
      },
    });

    const job = await this.pdfQueue.add(
      'export-pdf',
      {
        exportId: exportRecord.id,
        configurationId,
        sessionId,
        options,
      },
      { jobId: exportRecord.id },
    );

    this.logger.log(`PDF export job queued: ${job.id} for export ${exportRecord.id}`);

    return { jobId: job.id as string, exportId: exportRecord.id };
  }

  async exportAR(
    configurationId: string,
    sessionId: string | null,
    userId: string,
    options?: { platform?: 'ios' | 'android' } & ExportOptions,
  ): Promise<{ jobId: string; exportId: string }> {
    const config = await this.prisma.configurator3DConfiguration.findUnique({
      where: { id: configurationId },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configurationId} not found`,
      );
    }

    const exportRecord = await this.prisma.configurator3DExport.create({
      data: {
        configurationId,
        sessionId,
        userId,
        type:
          options?.platform === 'android'
            ? ExportType.AR_ANDROID
            : ExportType.AR_IOS,
        format: options?.platform ?? 'ios',
        status: ExportStatus.PENDING,
        options: (options || {}) as object,
      },
    });

    const job = await this.export3DQueue.add(
      'export-ar',
      {
        exportId: exportRecord.id,
        configurationId,
        sessionId,
        options,
      },
      { jobId: exportRecord.id },
    );

    this.logger.log(`AR export job queued: ${job.id} for export ${exportRecord.id}`);

    return { jobId: job.id as string, exportId: exportRecord.id };
  }

  async export3D(
    configurationId: string,
    sessionId: string | null,
    userId: string,
    options?: ExportOptions,
  ): Promise<{ jobId: string; exportId: string }> {
    const config = await this.prisma.configurator3DConfiguration.findUnique({
      where: { id: configurationId },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configurationId} not found`,
      );
    }

    const exportRecord = await this.prisma.configurator3DExport.create({
      data: {
        configurationId,
        sessionId,
        userId,
        type: ExportType.MODEL_3D,
        format: options?.format ?? 'glb',
        status: ExportStatus.PENDING,
        options: (options || {}) as object,
      },
    });

    const job = await this.export3DQueue.add(
      'export-3d',
      {
        exportId: exportRecord.id,
        configurationId,
        sessionId,
        options,
      },
      { jobId: exportRecord.id },
    );

    this.logger.log(`3D export job queued: ${job.id} for export ${exportRecord.id}`);

    return { jobId: job.id as string, exportId: exportRecord.id };
  }

  async exportImage(
    configurationId: string,
    sessionId: string | null,
    userId: string,
    options?: ExportOptions,
  ): Promise<{ jobId: string; exportId: string }> {
    const config = await this.prisma.configurator3DConfiguration.findUnique({
      where: { id: configurationId },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${configurationId} not found`,
      );
    }

    const exportRecord = await this.prisma.configurator3DExport.create({
      data: {
        configurationId,
        sessionId,
        userId,
        type: ExportType.IMAGE,
        format: options?.format ?? 'png',
        status: ExportStatus.PENDING,
        options: (options || {}) as object,
      },
    });

    const job = await this.pdfQueue.add(
      'export-image',
      {
        exportId: exportRecord.id,
        configurationId,
        sessionId,
        options,
      },
      { jobId: exportRecord.id },
    );

    this.logger.log(`Image export job queued: ${job.id} for export ${exportRecord.id}`);

    return { jobId: job.id as string, exportId: exportRecord.id };
  }

  async getStatus(exportId: string, userId: string) {
    const exportRecord = await this.prisma.configurator3DExport.findFirst({
      where: { id: exportId, userId },
    });

    if (!exportRecord) {
      throw new NotFoundException(`Export ${exportId} not found`);
    }

    return {
      id: exportRecord.id,
      type: exportRecord.type,
      format: exportRecord.format,
      status: exportRecord.status,
      progress: exportRecord.progress,
      fileUrl: exportRecord.fileUrl,
      fileName: exportRecord.fileName,
      fileSize: exportRecord.fileSize,
      errorMessage: exportRecord.errorMessage,
      createdAt: exportRecord.createdAt,
      completedAt: exportRecord.completedAt,
    };
  }

  async download(exportId: string, userId: string): Promise<Readable | null> {
    const exportRecord = await this.prisma.configurator3DExport.findFirst({
      where: { id: exportId, userId },
    });

    if (!exportRecord) {
      throw new NotFoundException(`Export ${exportId} not found`);
    }

    if (exportRecord.status !== ExportStatus.COMPLETED) {
      throw new BadRequestException(
        `Export is not ready for download (status: ${exportRecord.status})`,
      );
    }

    if (!exportRecord.fileUrl) {
      throw new BadRequestException('Export file URL is missing');
    }

    if (exportRecord.fileUrl.startsWith('http')) {
      const url = new URL(exportRecord.fileUrl);
      const get = url.protocol === 'https:' ? httpsGet : httpGet;
      return new Promise<Readable>((resolve, reject) => {
        get(exportRecord.fileUrl!, (res) => {
          resolve(res as unknown as Readable);
        }).on('error', reject);
      });
    }

    if (exportRecord.fileUrl.startsWith('/')) {
      return createReadStream(exportRecord.fileUrl);
    }

    this.logger.warn(`Unsupported file URL format: ${exportRecord.fileUrl}`);
    return null;
  }

  async updateExportStatus(
    exportId: string,
    status: ExportStatus,
    data?: {
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      progress?: number;
      errorMessage?: string;
    },
  ) {
    await this.prisma.configurator3DExport.update({
      where: { id: exportId },
      data: {
        status,
        ...(data?.fileUrl && { fileUrl: data.fileUrl }),
        ...(data?.fileName && { fileName: data.fileName }),
        ...(data?.fileSize !== undefined && { fileSize: data.fileSize }),
        ...(data?.progress !== undefined && { progress: data.progress }),
        ...(data?.errorMessage && { errorMessage: data.errorMessage }),
        ...(status === ExportStatus.COMPLETED && { completedAt: new Date() }),
        ...(status === ExportStatus.FAILED && { completedAt: new Date() }),
      },
    });
  }
}
