import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { HealthModule } from '@/modules/health/health.module';
import { StatusPageController } from './status-page.controller';
import { StatusPageService } from './status-page.service';

@Module({
  imports: [PrismaOptimizedModule, HealthModule],
  controllers: [StatusPageController],
  providers: [StatusPageService],
  exports: [StatusPageService],
})
export class StatusPageModule {}
