import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { QueuesModule } from '@/libs/queues';
import { MemoryController } from './memory.controller';
import { MemoryProcessor } from './memory.processor';
import { MemoryService } from './memory.service';

@Module({
  imports: [PrismaOptimizedModule, QueuesModule],
  controllers: [MemoryController],
  providers: [MemoryService, MemoryProcessor],
  exports: [MemoryService],
})
export class MemoryModule {}
