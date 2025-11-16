import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueNames } from '@/jobs/queue.constants';
import { ProductionJobQueueService } from './services/production-job-queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueNames.PRODUCTION_PROCESSING,
    }),
  ],
  providers: [ProductionJobQueueService],
  exports: [ProductionJobQueueService],
})
export class ProductionModule {}

