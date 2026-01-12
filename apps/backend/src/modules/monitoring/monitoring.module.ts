import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { PerformanceMiddleware } from './performance.middleware';
import { MonitoringController } from './monitoring.controller';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MonitoringController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class MonitoringModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply performance middleware to all routes
    consumer.apply(PerformanceMiddleware).forRoutes('*');
  }
}
