import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ExportPackService } from '@/modules/manufacturing/services/export-pack.service';
import * as Sentry from '@sentry/nestjs';

interface ExportPackJob {
  snapshotId: string;
  formats?: ('svg' | 'dxf' | 'pdf')[];
  includeMetadata?: boolean;
  compression?: 'none' | 'zip';
}

@Processor('export-manufacturing')
export class ExportPackProcessor {
  private readonly logger = new Logger(ExportPackProcessor.name);

  constructor(
    private prisma: PrismaService,
    private exportPackService: ExportPackService,
  ) {}

  @Process('export')
  async process(job: Job<ExportPackJob>): Promise<any> {
    const { snapshotId, formats, includeMetadata, compression } = job.data;
    const startTime = Date.now();

    try {
      // 1. Vérifier que le snapshot existe
      const snapshot = await this.prisma.snapshot.findUnique({
        where: { id: snapshotId },
      });

      if (!snapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      // 2. Vérifier idempotency (si bundle existe déjà)
      if (snapshot.productionBundleUrl) {
        this.logger.log(`Production bundle already exists for snapshot ${snapshotId}`);
        return {
          snapshotId,
          url: snapshot.productionBundleUrl,
          cached: true,
        };
      }

      // 3. Générer le pack d'export
      const result = await this.exportPackService.generateExportPack(snapshotId, {
        formats: formats || ['svg', 'dxf', 'pdf'],
        includeMetadata: includeMetadata !== false,
        compression: compression || 'zip',
      });

      const duration = Date.now() - startTime;
      this.logger.log(`Export pack generated for snapshot ${snapshotId} in ${duration}ms`);

      return {
        snapshotId,
        ...result,
        duration,
      };
    } catch (error) {
      this.logger.error(`Export pack failed for snapshot ${snapshotId}`, error);
      
      Sentry.captureException(error, {
        tags: {
          jobId: job.id,
          snapshotId,
        },
        extra: {
          jobData: job.data,
        },
      });

      throw error; // BullMQ va retry
    }
  }
}

