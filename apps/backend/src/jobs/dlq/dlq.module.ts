import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DLQService } from './dlq.service';
import { DLQController } from './dlq.controller';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'ai-generation' },
      { name: 'design-generation' },
      { name: 'render-processing' },
      { name: 'production-processing' },
    ),
  ],
  providers: [DLQService],
  controllers: [DLQController],
  exports: [DLQService],
})
export class DLQModule {}






























