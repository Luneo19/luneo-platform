/**
 * @fileoverview Module Luna (Agent B2B)
 * @module LunaModule
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Export des services
 * - ✅ Import des dépendances
 */

import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LunaController } from './luna.controller';
import { LunaService } from './luna.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { ProductsModule } from '@/modules/products/products.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { AgentsModule } from '../agents.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    StorageModule,
    ProductsModule,
    AnalyticsModule, // Pour ReportsService
    forwardRef(() => AgentsModule), // Pour LLMRouterService, ConversationService, AgentMemoryService et tous leurs dépendances
    HttpModule,
  ],
  controllers: [LunaController],
  providers: [LunaService],
  exports: [LunaService], // ✅ RÈGLE: Export obligatoire
})
export class LunaModule {}
