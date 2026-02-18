import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NovaController } from './nova.controller';
import { NovaService } from './nova.service';
import { NovaTicketsService } from './services/nova-tickets.service';
import { NovaEscalationService } from './services/nova-escalation.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { AgentsModule } from '../agents.module';
import { UsageGuardianModule } from '../usage-guardian/usage-guardian.module';
import { AIMonitorModule } from '../ai-monitor/ai-monitor.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    forwardRef(() => AgentsModule),
    UsageGuardianModule,
    AIMonitorModule,
    HttpModule,
  ],
  controllers: [NovaController],
  providers: [NovaService, NovaTicketsService, NovaEscalationService],
  exports: [NovaService, NovaTicketsService, NovaEscalationService],
})
export class NovaModule {}
