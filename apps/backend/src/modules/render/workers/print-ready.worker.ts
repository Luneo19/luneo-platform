import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RenderPrintReadyService, PrintReadyRenderRequest } from '../services/render-print-ready.service';

export interface PrintReadyRenderJob {
  requestId: string;
  designId: string;
  productId: string;
  width: number;
  height: number;
  dpi?: number;
  format?: 'png' | 'jpg' | 'pdf';
  quality?: number;
  backgroundColor?: string;
  bleed?: number;
}

@Processor('render-print-ready')
export class PrintReadyWorker {
  private readonly logger = new Logger(PrintReadyWorker.name);

  constructor(
    private readonly renderPrintReadyService: RenderPrintReadyService,
  ) {}

  @Process({
    name: 'render-print-ready',
    concurrency: 2, // Process 2 jobs concurrently
  })
  async process(job: Job<PrintReadyRenderJob>): Promise<{ success: boolean; result: { status: string; url?: string; error?: string } }> {
    const { requestId, designId, productId, width, height, dpi, format, quality, backgroundColor, bleed } = job.data;

    this.logger.log(`Processing print-ready render job ${job.id} for request ${requestId}`);

    try {
      // Update job progress
      await job.updateProgress(10);

      const request: PrintReadyRenderRequest = {
        id: requestId,
        designId,
        productId,
        width,
        height,
        dpi,
        format,
        quality,
        backgroundColor,
        bleed,
      };

      // Update progress
      await job.updateProgress(30);

      // Render
      const result = await this.renderPrintReadyService.renderPrintReady(request);

      // Update progress
      await job.updateProgress(90);

      if (result.status === 'failed') {
        throw new Error(result.error || 'Render failed');
      }

      // Update progress to 100%
      await job.updateProgress(100);

      this.logger.log(`Print-ready render job ${job.id} completed successfully`);

      return {
        success: true,
        result,
      };
    } catch (error) {
      this.logger.error(`Print-ready render job ${job.id} failed:`, error);
      
      // Update job with error
      await job.updateProgress(100);
      
      throw error;
    }
  }
}

