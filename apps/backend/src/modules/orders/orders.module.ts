import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersInternalController } from './orders.internal.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { ProductionModule } from '@/modules/production/production.module';
import { InternalTokenGuard } from '@/common/guards/internal-token.guard';

@Module({
  imports: [PrismaModule, ProductionModule],
  controllers: [OrdersController, OrdersInternalController],
  providers: [OrdersService, InternalTokenGuard],
  exports: [OrdersService],
})
export class OrdersModule {}
