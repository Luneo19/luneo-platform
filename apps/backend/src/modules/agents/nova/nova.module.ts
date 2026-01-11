/**
 * @fileoverview Module Nova (Agent Support)
 * @module NovaModule
 */

/**
 * @fileoverview Module Nova (Agent Support)
 * @module NovaModule
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NovaController } from './nova.controller';
import { NovaService } from './nova.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { LLMRouterService } from '../services/llm-router.service';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    HttpModule,
  ],
  controllers: [NovaController],
  providers: [
    NovaService,
    LLMRouterService,
  ],
  exports: [NovaService],
})
export class NovaModule {}
