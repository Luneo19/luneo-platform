import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrionController } from './orion.controller';
import { OrionService } from './orion.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SegmentsModule } from './segments/segments.module';
import { CommunicationsModule } from './communications/communications.module';
import { RetentionModule } from './retention/retention.module';
import { RevenueModule } from './revenue/revenue.module';
import { AdminToolsModule } from './admin-tools/admin-tools.module';
import { QuickWinsModule } from './quick-wins/quick-wins.module';
import { AutomationsModule } from './automations/automations.module';
import { OrionMetricsModule } from './metrics/metrics.module';
import { PrometheusModule } from './agents/prometheus/prometheus.module';
import { ZeusModule } from './agents/zeus/zeus.module';
import { AthenaModule } from './agents/athena/athena.module';
import { ApolloModule } from './agents/apollo/apollo.module';
import { ArtemisModule } from './agents/artemis/artemis.module';
import { HermesModule } from './agents/hermes/hermes.module';
import { HadesModule } from './agents/hades/hades.module';
import { AutomationsV2Module } from './automations-v2/automations-v2.module';
import { EscalationService } from './services/escalation.service';
import { IntentClassifierService } from './services/intent-classifier.service';
import { FeedbackLoopService } from './services/feedback-loop.service';
import { MacroService } from './services/macro.service';
import { EmailInboundService } from './channels/email-inbound.service';
import { FallbackLLMService } from './services/fallback-llm.service';
import { PromptSecurityService } from './services/prompt-security.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    SegmentsModule,
    CommunicationsModule,
    RetentionModule,
    RevenueModule,
    AdminToolsModule,
    QuickWinsModule,
    AutomationsModule,
    OrionMetricsModule,
    PrometheusModule,
    ZeusModule,
    AthenaModule,
    ApolloModule,
    ArtemisModule,
    HermesModule,
    HadesModule,
    AutomationsV2Module,
  ],
  controllers: [OrionController],
  providers: [
    OrionService,
    EscalationService,
    IntentClassifierService,
    FeedbackLoopService,
    MacroService,
    EmailInboundService,
    FallbackLLMService,
    PromptSecurityService,
  ],
  exports: [
    OrionService,
    SegmentsModule,
    RetentionModule,
    RevenueModule,
    QuickWinsModule,
    AutomationsModule,
    OrionMetricsModule,
    PrometheusModule,
    ZeusModule,
    AthenaModule,
    ApolloModule,
    ArtemisModule,
    HermesModule,
    HadesModule,
    AutomationsV2Module,
    EscalationService,
    MacroService,
  ],
})
export class OrionModule {}
