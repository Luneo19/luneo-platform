import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [PrismaOptimizedModule, SmartCacheModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
