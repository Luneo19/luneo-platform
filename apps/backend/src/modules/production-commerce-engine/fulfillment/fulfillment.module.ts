import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';

import { PrismaModule } from '@/libs/prisma/prisma.module';
import { PCE_QUEUES } from '../pce.constants';
import { SHIPPING_PROVIDER_REGISTRY } from './services/shipping.types';

import { FulfillmentService } from './services/fulfillment.service';
import { ShippingService } from './services/shipping.service';
import { TrackingService } from './services/tracking.service';
import { ReturnService } from './services/return.service';

import { FulfillmentController } from './controllers/fulfillment.controller';
import { ReturnsController } from './controllers/returns.controller';
import { ShippingController } from './controllers/shipping.controller';

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({ timeout: 30000, maxRedirects: 3 }),
    BullModule.registerQueue({ name: PCE_QUEUES.FULFILLMENT }),
  ],
  controllers: [
    FulfillmentController,
    ReturnsController,
    ShippingController,
  ],
  providers: [
    FulfillmentService,
    ShippingService,
    TrackingService,
    ReturnService,
    {
      provide: SHIPPING_PROVIDER_REGISTRY,
      useValue: [] as import('./services/shipping.types').IShippingProvider[],
    },
  ],
  exports: [
    FulfillmentService,
    ShippingService,
    TrackingService,
    ReturnService,
  ],
})
export class FulfillmentModule {}
