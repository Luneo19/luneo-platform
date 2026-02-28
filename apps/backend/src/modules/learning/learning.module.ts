import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { QueuesModule } from '@/libs/queues';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';
import { LearningProcessor } from './learning.processor';
import { LearningScheduler } from './learning.scheduler';

@Module({
  imports: [PrismaOptimizedModule, QueuesModule],
  controllers: [LearningController],
  providers: [LearningService, LearningProcessor, LearningScheduler],
  exports: [LearningService],
})
export class LearningModule {}
