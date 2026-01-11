/**
 * @fileoverview Module Luna (Agent B2B)
 * @module LunaModule
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Export des services
 * - ✅ Import des dépendances
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LunaController } from './luna.controller';
import { LunaService } from './luna.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { ProductsModule } from '@/modules/products/products.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { AiModule } from '@/modules/ai/ai.module';
import { LLMRouterService } from '../services/llm-router.service';
import { ConversationService } from '../services/conversation.service';
import { AgentMemoryService } from '../services/agent-memory.service';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    StorageModule,
    ProductsModule,
    AnalyticsModule, // Pour ReportsService
    AiModule, // Pour AiService utilisé par LLMRouterService
    HttpModule,
  ],
  controllers: [LunaController],
  providers: [
    LunaService,
    LLMRouterService,
    ConversationService,
    AgentMemoryService,
  ],
  exports: [LunaService], // ✅ RÈGLE: Export obligatoire
})
export class LunaModule {}
