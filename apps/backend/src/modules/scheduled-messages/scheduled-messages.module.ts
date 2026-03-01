import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { ScheduledMessagesController } from './scheduled-messages.controller';
import { ScheduledMessagesService } from './scheduled-messages.service';
import { ScheduledMessagesScheduler } from './scheduled-messages.scheduler';

@Module({
  imports: [PrismaOptimizedModule],
  controllers: [ScheduledMessagesController],
  providers: [ScheduledMessagesService, ScheduledMessagesScheduler],
  exports: [ScheduledMessagesService],
})
export class ScheduledMessagesModule {}
