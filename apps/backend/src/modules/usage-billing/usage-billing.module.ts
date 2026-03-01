import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { UsageMeteringService } from './usage-metering.service';
import { UsageBillingController } from './usage-billing.controller';

@Module({
  imports: [PrismaOptimizedModule],
  providers: [UsageMeteringService],
  controllers: [UsageBillingController],
  exports: [UsageMeteringService],
})
export class UsageBillingModule {}

