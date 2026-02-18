import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { ConversationMemoryService } from './conversation-memory.service';
import { MemorySummarizerService } from './memory-summarizer.service';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  providers: [ConversationMemoryService, MemorySummarizerService],
  exports: [ConversationMemoryService, MemorySummarizerService],
})
export class MemoryModule {}
