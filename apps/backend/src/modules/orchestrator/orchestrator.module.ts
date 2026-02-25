import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrchestratorService } from './orchestrator.service';
import { RagModule } from '@/modules/rag/rag.module';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { EmailModule } from '@/modules/email/email.module';
import { BillingModule } from '@/modules/billing/billing.module';
import { ToolRegistryService } from './tools/tool-registry.service';
import { ActionRegistryService } from './actions/action-registry.service';
import { BookingExecutor } from './actions/executors/booking.executor';
import { EmailExecutor } from './actions/executors/email.executor';
import { TicketExecutor } from './actions/executors/ticket.executor';
import { CrmExecutor } from './actions/executors/crm.executor';
import { EcommerceExecutor } from './actions/executors/ecommerce.executor';
import { CustomApiExecutor } from './actions/executors/custom-api.executor';
import { IntegrationRouterService } from '@/modules/integrations/providers/integration-router.service';
import { HubSpotProvider } from '@/modules/integrations/providers/hubspot.provider';
import { SalesforceProvider } from '@/modules/integrations/providers/salesforce.provider';
import { GoogleCalendarProvider } from '@/modules/integrations/providers/google-calendar.provider';
import { CalendlyProvider } from '@/modules/integrations/providers/calendly.provider';
import { MailchimpProvider } from '@/modules/integrations/providers/mailchimp.provider';

const actionExecutors = [
  BookingExecutor,
  EmailExecutor,
  TicketExecutor,
  CrmExecutor,
  EcommerceExecutor,
  CustomApiExecutor,
];

const integrationProviders = [
  IntegrationRouterService,
  HubSpotProvider,
  SalesforceProvider,
  GoogleCalendarProvider,
  CalendlyProvider,
  MailchimpProvider,
];

@Module({
  imports: [
    ConfigModule,
    RagModule,
    PrismaOptimizedModule,
    EmailModule,
    BillingModule,
  ],
  providers: [
    OrchestratorService,
    ToolRegistryService,
    ActionRegistryService,
    ...actionExecutors,
    ...integrationProviders,
  ],
  exports: [OrchestratorService, ToolRegistryService, ActionRegistryService],
})
export class OrchestratorModule {}
