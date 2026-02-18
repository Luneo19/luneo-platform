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
import { LunaDesignService } from './services/luna-design.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { ProductsModule } from '@/modules/products/products.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { AgentsModule } from '../agents.module';
import { UsageGuardianModule } from '../usage-guardian/usage-guardian.module';
import { AIMonitorModule } from '../ai-monitor/ai-monitor.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    StorageModule,
    ProductsModule,
    AnalyticsModule,
    forwardRef(() => AgentsModule),
    UsageGuardianModule,
    AIMonitorModule,
    HttpModule,
  ],
  controllers: [LunaController],
  providers: [LunaService, LunaDesignService],
  exports: [LunaService, LunaDesignService],
})
export class LunaModule {}
