import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ALL_QUEUE_NAMES } from './queues.constants';
import { QueuesService } from './queues.service';

@Module({
  imports: ALL_QUEUE_NAMES.map((name) => BullModule.registerQueue({ name })),
  providers: [QueuesService],
  exports: [BullModule, QueuesService],
})
export class QueuesModule {}
