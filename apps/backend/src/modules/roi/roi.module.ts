import { Module } from '@nestjs/common';
import { QueuesModule } from '@/libs/queues';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { RoiController } from './roi.controller';
import { RoiProcessor } from './roi.processor';
import { RoiScheduler } from './roi.scheduler';
import { RoiService } from './roi.service';

@Module({
  imports: [PrismaOptimizedModule, QueuesModule],
  controllers: [RoiController],
  providers: [RoiService, RoiProcessor, RoiScheduler],
  exports: [RoiService],
})
export class RoiModule {}
