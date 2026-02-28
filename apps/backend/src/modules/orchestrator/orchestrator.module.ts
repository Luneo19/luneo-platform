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
import { IntegrationHttpClient } from '@/modules/integrations/providers/integration-http.client';
import { QuotasModule } from '@/modules/quotas/quotas.module';
import { UsageBillingModule } from '@/modules/usage-billing/usage-billing.module';
import { WorkflowEngineService } from './workflow/workflow-engine.service';
import { MemoryModule } from '@/modules/memory/memory.module';
import { QueuesModule } from '@/libs/queues/queues.module';

const actionExecutors = [
  BookingExecutor,
  EmailExecutor,
  TicketExecutor,
  CrmExecutor,
  EcommerceExecutor,
  CustomApiExecutor,
];

const integrationProviders = [
  IntegrationHttpClient,
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
    QuotasModule,
    UsageBillingModule,
    MemoryModule,
    QueuesModule,
  ],
  providers: [
    OrchestratorService,
    WorkflowEngineService,
    ToolRegistryService,
    ActionRegistryService,
    ...actionExecutors,
    ...integrationProviders,
  ],
  exports: [OrchestratorService, WorkflowEngineService, ToolRegistryService, ActionRegistryService],
})
export class OrchestratorModule {}
