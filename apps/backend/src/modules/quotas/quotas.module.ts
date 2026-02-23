import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { QuotasService } from './quotas.service';

@Module({
  imports: [PrismaOptimizedModule],
  providers: [QuotasService],
  exports: [QuotasService],
})
export class QuotasModule {}
