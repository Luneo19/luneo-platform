import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaModule } from '@/libs/prisma/prisma.module';
import { UsageBillingModule } from '@/modules/usage-billing/usage-billing.module';
import { PCE_QUEUES, PCE_QUEUE_DEFAULTS } from './pce.constants';

// Core services
import { PCEOrchestratorService } from './core/pce-orchestrator.service';
import { PipelineOrchestratorService } from './core/pipeline-orchestrator.service';
import { EventBusService } from './core/event-bus.service';
import { StateMachineService } from './core/state-machine.service';
import { PCEConfigService } from './core/pce-config.service';

// Observability
import { PCEMetricsService } from './observability/pce-metrics.service';
import { PCEHealthService } from './observability/pce-health.service';
import { PCEAlertsService } from './observability/pce-alerts.service';

// Queues
import { QueueManagerService } from './queues/queue-manager.service';
import { QueueMonitorService } from './queues/queue-monitor.service';
import { QueueHealthService } from './queues/queue-health.service';
import { PipelineProcessor } from './queues/pipeline.processor';
import { FulfillmentProcessor } from './queues/fulfillment.processor';

// Event listeners
import { OrderEventListener } from './listeners/order-event.listener';
import { RenderEventListener } from './listeners/render-event.listener';
import { ProductionEventListener } from './listeners/production-event.listener';
import { FulfillmentEventListener } from './listeners/fulfillment-event.listener';
import { SyncEventListener } from './listeners/sync-event.listener';
import { UsageEventListener } from './listeners/usage-event.listener';

// Schedulers
import { PCESchedulerService } from './schedulers/pce-scheduler.service';

// Guards
import { PCEQuotaGuard } from './guards/pce-quota.guard';

// Controllers
import { PCEController } from './pce.controller';
import { PCEWebhooksController } from './webhooks/webhook.controller';
import { PCEAdminController } from './pce-admin.controller';

// Sub-modules
import { ManufacturingModule } from './manufacturing/manufacturing.module';
import { FulfillmentModule } from './fulfillment/fulfillment.module';
import { PCEQueuesModule } from './queues/queues.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    UsageBillingModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get('BULLMQ_REDIS_URL') || configService.get('REDIS_URL') || 'redis://localhost:6379',
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: PCE_QUEUES.PIPELINE, defaultJobOptions: PCE_QUEUE_DEFAULTS },
      { name: PCE_QUEUES.FULFILLMENT, defaultJobOptions: PCE_QUEUE_DEFAULTS },
    ),
    ManufacturingModule,
    FulfillmentModule,
    PCEQueuesModule,
  ],
  controllers: [PCEController, PCEWebhooksController, PCEAdminController],
  providers: [
    PCEQuotaGuard,
    // Core
    PCEOrchestratorService,
    PipelineOrchestratorService,
    EventBusService,
    StateMachineService,
    PCEConfigService,

    // Observability
    PCEMetricsService,
    PCEHealthService,
    PCEAlertsService,

    // Queues (all 7 registered above)
    QueueManagerService,
    QueueMonitorService,
    QueueHealthService,
    PipelineProcessor,
    FulfillmentProcessor,

    // Event listeners
    OrderEventListener,
    RenderEventListener,
    ProductionEventListener,
    FulfillmentEventListener,
    SyncEventListener,
    UsageEventListener,

    // Schedulers
    PCESchedulerService,
  ],
  exports: [
    PCEOrchestratorService,
    PipelineOrchestratorService,
    EventBusService,
    PCEConfigService,
    PCEMetricsService,
    PCEHealthService,
    QueueManagerService,
    QueueMonitorService,
    QueueHealthService,
  ],
})
export class ProductionCommerceEngineModule {}
