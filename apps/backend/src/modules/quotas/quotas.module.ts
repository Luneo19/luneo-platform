import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { QuotasService } from './quotas.service';
import { QuotaEnforcementService } from './quota-enforcement.service';

@Module({
  imports: [PrismaOptimizedModule],
  providers: [QuotasService, QuotaEnforcementService],
  exports: [QuotasService, QuotaEnforcementService],
})
export class QuotasModule {}
