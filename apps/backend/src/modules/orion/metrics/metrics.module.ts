import { Module } from '@nestjs/common';
import { OrionMetricsController } from './metrics.controller';
import { OrionMetricsService } from './metrics.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrionMetricsController],
  providers: [OrionMetricsService],
  exports: [OrionMetricsService],
})
export class OrionMetricsModule {}
