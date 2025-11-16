import 'dotenv/config';
import { ImageGenerationWorker } from './jobs/generateImage';
import { UpscaleWorker } from './jobs/upscale';
import { BlendTextureWorker } from './jobs/blendTexture';
import { ExportGLTFWorker } from './jobs/exportGLTF';
import { ARPreviewWorker } from './jobs/arPreview';
import { RenderJobWorker } from './jobs/render-job';
import { createWorkerLogger, logger, serializeError } from './utils/logger';
import { initializeTracing, shutdownTracing } from './observability/tracing';
const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};


interface Worker {
  start(): Promise<void>;
  stop(): Promise<void>;
}

class LuneoAIWorker {
  private workers: Array<{ name: string; worker: Worker }> = [];
  private readonly logger = createWorkerLogger('luneo-ai-service');

  constructor() {
    this.initializeWorkers();
  }

  private async initializeWorkers(): Promise<void> {
    try {
      this.logger.info('Initializing Luneo AI workers');

      // Initialize all workers
      const imageWorker = new ImageGenerationWorker(REDIS_CONNECTION);
      const upscaleWorker = new UpscaleWorker(REDIS_CONNECTION);
      const blendWorker = new BlendTextureWorker(REDIS_CONNECTION);
      const gltfWorker = new ExportGLTFWorker(REDIS_CONNECTION);
      const arWorker = new ARPreviewWorker(REDIS_CONNECTION);
      const renderWorker = new RenderJobWorker(REDIS_CONNECTION);

      this.workers = [
        { name: 'ImageGeneration', worker: imageWorker },
        { name: 'Upscale', worker: upscaleWorker },
        { name: 'BlendTexture', worker: blendWorker },
        { name: 'ExportGLTF', worker: gltfWorker },
        { name: 'ARPreview', worker: arWorker },
        { name: 'RenderJob', worker: renderWorker },
      ];

      // Start all workers
      for (const { name, worker } of this.workers) {
        await worker.start();
        this.logger.info('Worker started', { worker: name });
      }

      this.logger.info('All AI workers initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize workers', {
        error: serializeError(error),
      });
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    this.logger.info('Luneo AI worker service starting', { pid: process.pid });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    
    this.logger.info('Luneo AI worker service is running');
  }

  private async gracefulShutdown(signal: NodeJS.Signals): Promise<void> {
    this.logger.warn('Received shutdown signal, stopping workers', { signal });
    
    try {
      // Stop all workers
      for (const { name, worker } of this.workers) {
        await worker.stop();
        this.logger.info('Worker stopped', { worker: name });
      }
      
      this.logger.info('All workers stopped gracefully');
      await shutdownTracing();
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during shutdown', {
        error: serializeError(error),
      });
      process.exit(1);
    }
  }
}

async function bootstrap(): Promise<void> {
  await initializeTracing();
  const luneoWorker = new LuneoAIWorker();
  await luneoWorker.start();
}

bootstrap().catch(async (error) => {
  logger.error('Failed to start Luneo AI worker', {
    error: serializeError(error),
  });
  await shutdownTracing();
  process.exit(1);
});


