import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { PromptManagerService } from './prompt-manager.service';
import { PromptBuilderService } from './prompt-builder.service';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  providers: [PromptManagerService, PromptBuilderService],
  exports: [PromptManagerService, PromptBuilderService],
})
export class PromptsModule {}
