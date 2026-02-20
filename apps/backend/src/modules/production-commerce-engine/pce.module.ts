import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '@/libs/prisma/prisma.module';
import { UsageBillingModule } from '@/modules/usage-billing/usage-billing.module';

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

// Queue shim (in-process EventEmitter-based queues replacing BullMQ)
import { createPCEQueueProviders } from './queues/pce-queue.provider';
import { QueueManagerService } from './queues/queue-manager.service';
import { QueueMonitorService } from './queues/queue-monitor.service';
import { QueueHealthService } from './queues/queue-health.service';

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

const logger = new Logger('PCEModule');
const queueProviders = createPCEQueueProviders();

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    UsageBillingModule,
    ManufacturingModule,
    FulfillmentModule,
  ],
  controllers: [PCEController, PCEWebhooksController, PCEAdminController],
  providers: [
    PCEQuotaGuard,
    ...queueProviders,

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

    // Queue management
    QueueManagerService,
    QueueMonitorService,
    QueueHealthService,

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
export class ProductionCommerceEngineModule {
  constructor() {
    logger.log('Production & Commerce Engine module initialized');
  }
}
