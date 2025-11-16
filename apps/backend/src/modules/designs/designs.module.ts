import { Module } from '@nestjs/common';
import { DesignsController } from './designs.controller';
import { DesignsService } from './designs.service';
import { UVReprojectorUtil } from './utils/uv-reprojector.util';
import { CloudinaryService } from '@/libs/storage/cloudinary.service';
import { UsdzConverterService } from './services/usdz-converter.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { AiModule } from '@/modules/ai/ai.module';
import { UsageBillingModule } from '@/modules/usage-billing/usage-billing.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';
import { QuotaGuard } from '@/common/guards/quota.guard';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    UsageBillingModule,
    RedisOptimizedModule,
  ],
  controllers: [DesignsController],
  providers: [
    DesignsService,
    UVReprojectorUtil,
    CloudinaryService,
    UsdzConverterService,
    QuotaGuard,
  ],
  exports: [DesignsService],
})
export class DesignsModule {}
