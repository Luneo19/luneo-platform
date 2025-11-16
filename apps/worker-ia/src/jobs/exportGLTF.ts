import { Job, Worker, type KeepJobs, type WorkerOptions } from 'bullmq';
import type { Logger } from 'winston';
import {
  glbToGltf,
  gltfToGlb,
  processGlb,
  processGltf,
} from 'gltf-pipeline';
import { createWorkerLogger, serializeError } from '../utils/logger';
import { saveToStorage } from '../utils/storage';
import type {
  ExportGLTFJobData,
  ExportGLTFResult,
  GLTFOptimizationOptions,
} from '../types';
import { traceJob, withActiveSpan } from '../observability/span-helpers';

const DEFAULT_REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD,
};

type WorkerConnection = WorkerOptions['connection'];
const CLEANUP_ON_COMPLETE: KeepJobs = { count: 50 };
const CLEANUP_ON_FAIL: KeepJobs = { count: 25 };

export class ExportGLTFWorker {
  private worker: Worker<ExportGLTFJobData, ExportGLTFResult>;
  private readonly logger: Logger;

  constructor(connection: WorkerConnection = DEFAULT_REDIS_CONNECTION) {
    this.logger = createWorkerLogger('export-gltf');

    this.worker = new Worker<ExportGLTFJobData, ExportGLTFResult>(
      'export-gltf',
      this.processJob.bind(this),
      {
        connection,
        concurrency: 2,
        removeOnComplete: CLEANUP_ON_COMPLETE,
        removeOnFail: CLEANUP_ON_FAIL,
      }
    );

    this.worker.on('completed', (job) => {
      this.logger.info('GLTF export completed', {
        jobId: job.id,
        queue: job.queueName,
      });
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error('GLTF export failed', {
        jobId: job?.id,
        queue: job?.queueName,
        error: serializeError(err),
      });
    });
  }

  public async start(): Promise<void> {
    this.logger.info('Export GLTF worker started');
  }

  public async stop(): Promise<void> {
    await this.worker.close();
    this.logger.info('Export GLTF worker stopped');
  }

  private async processJob(job: Job<ExportGLTFJobData>): Promise<ExportGLTFResult> {
    return traceJob('worker.export-gltf.process', job, async () => {
      const { designId, modelUrl, format, optimization } = job.data;

      this.logger.info('Processing GLTF export', {
        jobId: job.id,
        designId,
        requestedFormat: format,
      });

      try {
        const sourceBuffer = await withActiveSpan(
          'worker.export-gltf.download',
          { 'http.url': modelUrl },
          async () => this.downloadModel(modelUrl),
        );
        const sourceFormat = this.detectFormat(sourceBuffer);

        const { buffer: optimizedBuffer, finalFormat } = await withActiveSpan(
          'worker.export-gltf.transform',
          {
            'model.sourceFormat': sourceFormat,
            'model.targetFormat': format,
          },
          async () =>
            this.transformModel(sourceBuffer, sourceFormat, format, optimization),
        );

        const saved = await withActiveSpan(
          'worker.export-gltf.save',
          { 'luneo.design.id': designId, 'model.format': finalFormat },
          async () =>
            saveToStorage(
              optimizedBuffer,
              `models/${designId}/${Date.now()}.${finalFormat}`,
              {
                contentType:
                  finalFormat === 'glb'
                    ? 'model/gltf-binary'
                    : 'model/gltf+json',
                metadata: {
                  designId,
                  requestedFormat: format,
                  sourceFormat,
                },
              },
            ),
        );

        return {
          success: true,
          modelUrl: saved.url,
          format: finalFormat,
          size: saved.size,
          metadata: {
            designId,
            format: finalFormat,
            optimization,
            exportedAt: new Date().toISOString(),
            sourceFormat,
          },
        };
      } catch (error) {
        this.logger.error('Error while exporting GLTF', {
          jobId: job.id,
          designId,
          error: serializeError(error),
        });
        throw error;
      }
    });
  }

  private async downloadModel(modelUrl: string): Promise<Buffer> {
    const response = await fetch(modelUrl);

    if (!response.ok) {
      throw new Error(
        `Impossible de télécharger le modèle: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private detectFormat(buffer: Buffer): 'glb' | 'gltf' {
    if (buffer.length >= 4 && buffer.toString('utf8', 0, 4) === 'glTF') {
      return 'glb';
    }

    return 'gltf';
  }

  private async transformModel(
    sourceBuffer: Buffer,
    sourceFormat: 'glb' | 'gltf',
    targetFormat: 'glb' | 'gltf',
    optimization?: GLTFOptimizationOptions
  ): Promise<{ buffer: Buffer; finalFormat: 'glb' | 'gltf' }> {
    // Aucune conversion nécessaire
    if (sourceFormat === targetFormat) {
      if (sourceFormat === 'glb') {
        const processed = await processGlb(sourceBuffer, optimization ?? {});
        return { buffer: processed.glb, finalFormat: 'glb' };
      }

      const gltf = JSON.parse(sourceBuffer.toString('utf8'));
      const processed = await processGltf(gltf, optimization ?? {});
      return {
        buffer: Buffer.from(JSON.stringify(processed.gltf ?? processed)),
        finalFormat: 'gltf',
      };
    }

    if (targetFormat === 'gltf' && sourceFormat === 'glb') {
      const { gltf } = await glbToGltf(sourceBuffer, {
        ...optimization,
      });
      const processed = await processGltf(gltf, optimization ?? {});
      return {
        buffer: Buffer.from(JSON.stringify(processed.gltf ?? processed)),
        finalFormat: 'gltf',
      };
    }

    if (targetFormat === 'glb' && sourceFormat === 'gltf') {
      const gltf = JSON.parse(sourceBuffer.toString('utf8'));
      const processed = await gltfToGlb(gltf, optimization ?? {});
      return {
        buffer: processed.glb,
        finalFormat: 'glb',
      };
    }

    // Fallback: retourner le buffer original
    return { buffer: sourceBuffer, finalFormat: sourceFormat };
  }
}

