/**
 * @fileoverview Module Aria (Agent B2C)
 * @module AriaModule
 */

/**
 * @fileoverview Module Aria (Agent B2C)
 * @module AriaModule
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AriaController } from './aria.controller';
import { AriaService } from './aria.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { LLMRouterService } from '../services/llm-router.service';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    HttpModule,
  ],
  controllers: [AriaController],
  providers: [
    AriaService,
    LLMRouterService,
  ],
  exports: [AriaService],
})
export class AriaModule {}
