import { Module } from '@nestjs/common';
import { ProductEngineController } from './product-engine.controller';
import { ProductRulesService } from './services/product-rules.service';
import { ZonesService } from './services/zones.service';
import { PricingEngine } from './services/pricing-engine.service';
import { ValidationEngine } from './services/validation-engine.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    BullModule.registerQueue({
      name: 'product-engine',
    }),
  ],
  controllers: [ProductEngineController],
  providers: [
    ProductRulesService,
    ZonesService,
    PricingEngine,
    ValidationEngine,
  ],
  exports: [
    ProductRulesService,
    ZonesService,
    PricingEngine,
    ValidationEngine,
  ],
})
export class ProductEngineModule {}


