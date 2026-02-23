import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RailwayHealthController } from './railway-health.controller';
import { HealthService } from './health.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';
import { CloudinaryModule } from '@/libs/storage/cloudinary.module';

@Module({
  imports: [
    TerminusModule,
    PrismaModule,
    RedisOptimizedModule,
    CloudinaryModule,
  ],
  controllers: [HealthController, RailwayHealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
