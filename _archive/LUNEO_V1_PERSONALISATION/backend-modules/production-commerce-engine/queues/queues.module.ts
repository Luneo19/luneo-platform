import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { PCE_QUEUES, PCE_QUEUE_DEFAULTS } from '../pce.constants';
import { RenderProcessor } from './render.processor';
import { SyncProcessor } from './sync.processor';
import { WebhookProcessor } from './webhook.processor';
import { ProductionProcessor } from './production.processor';
import { NotificationProcessor } from './notification.processor';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { RenderBridgeService } from '../bridges/render-bridge.service';
import { EcommerceBridgeService } from '../bridges/ecommerce-bridge.service';
import { ManufacturingModule } from '../manufacturing/manufacturing.module';

const newQueueNames = [
  PCE_QUEUES.RENDER,
  PCE_QUEUES.SYNC,
  PCE_QUEUES.PRODUCTION,
  PCE_QUEUES.WEBHOOKS,
  PCE_QUEUES.NOTIFICATIONS,
];

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    ManufacturingModule,
    BullModule.registerQueue(
      ...newQueueNames.map((name) => ({
        name,
        defaultJobOptions: PCE_QUEUE_DEFAULTS,
      })),
    ),
  ],
  providers: [
    RenderProcessor,
    SyncProcessor,
    WebhookProcessor,
    ProductionProcessor,
    NotificationProcessor,
    RenderBridgeService,
    EcommerceBridgeService,
  ],
  exports: [BullModule],
})
export class PCEQueuesModule {}
