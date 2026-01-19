/**
 * @fileoverview Module Aria (Agent B2C)
 * @module AriaModule
 */

/**
 * @fileoverview Module Aria (Agent B2C)
 * @module AriaModule
 */

import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AriaController } from './aria.controller';
import { AriaService } from './aria.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { AgentsModule } from '../agents.module';
import { UsageGuardianModule } from '../usage-guardian/usage-guardian.module';
import { AIMonitorModule } from '../ai-monitor/ai-monitor.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    forwardRef(() => AgentsModule), // Pour LLMRouterService et tous ses dépendances
    UsageGuardianModule, // Usage Guardian
    AIMonitorModule, // AI Monitor
    HttpModule,
  ],
  controllers: [AriaController],
  providers: [AriaService],
  exports: [AriaService],
})
export class AriaModule {}
