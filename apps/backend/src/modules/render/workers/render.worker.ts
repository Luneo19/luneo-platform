import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('render-2d')
export class RenderWorker {
  private readonly logger = new Logger(RenderWorker.name);

  @Process('render')
  async handleRender(job: Job) {
    this.logger.log(`Processing render job ${job.id}`);
    
    // Job processing logic
    return { status: 'completed' };
  }
}


