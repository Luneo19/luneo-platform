import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  RenderRequest,
  RenderResult,
  ExportJobData,
  ExportResult,
  RenderQueueResult,
} from '../interfaces/render.interface';
import { Render2DService } from '../services/render-2d.service';
import { Render3DService } from '../services/render-3d.service';
import { ExportService } from '../services/export.service';
import { QueueNames } from '@/jobs/queue.constants';

@Processor(QueueNames.RENDER_2D)
export class Render2DWorker extends WorkerHost {
  private readonly logger = new Logger(Render2DWorker.name);

  constructor(private readonly render2DService: Render2DService) {
    super();
  }

  async process(job: Job<RenderRequest>): Promise<RenderQueueResult> {
    this.logger.log(`Processing 2D render job ${job.id} for request ${job.data.id}`);
    const result = await this.render2DService.render2D(job.data);
    return {
      status: result.status,
      requestId: job.data.id,
      result,
    };
  }
}

@Processor(QueueNames.RENDER_3D)
export class Render3DWorker extends WorkerHost {
  private readonly logger = new Logger(Render3DWorker.name);

  constructor(private readonly render3DService: Render3DService) {
    super();
  }

  async process(job: Job<RenderRequest>): Promise<RenderQueueResult> {
    this.logger.log(`Processing 3D render job ${job.id} for request ${job.data.id}`);
    const result = await this.render3DService.render3D(job.data);
    return {
      status: result.status,
      requestId: job.data.id,
      result,
    };
  }
}

@Processor(QueueNames.EXPORT_GLTF)
export class ExportWorker extends WorkerHost {
  private readonly logger = new Logger(ExportWorker.name);

  constructor(private readonly exportService: ExportService) {
    super();
  }

  async process(job: Job<ExportJobData>): Promise<ExportResult> {
    this.logger.log(`Processing export job ${job.id} for ${job.data.assets.length} assets`);
    return this.exportService.exportAssets(job.data.assets, job.data.options);
  }
}


