/**
 * @fileoverview Module Nova (Agent Support)
 * @module NovaModule
 */

/**
 * @fileoverview Module Nova (Agent Support)
 * @module NovaModule
 */

import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NovaController } from './nova.controller';
import { NovaService } from './nova.service';
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
  controllers: [NovaController],
  providers: [NovaService],
  exports: [NovaService],
})
export class NovaModule {}
