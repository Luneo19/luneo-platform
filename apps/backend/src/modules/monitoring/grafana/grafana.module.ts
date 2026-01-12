/**
 * Grafana Module
 * Provides Grafana datasource integration
 */

import { Module } from '@nestjs/common';
import { GrafanaController } from './grafana.controller';
import { GrafanaDatasourceService } from './datasource.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';

@Module({
  imports: [PrismaModule, RedisOptimizedModule],
  controllers: [GrafanaController],
  providers: [GrafanaDatasourceService],
  exports: [GrafanaDatasourceService],
})
export class GrafanaModule {}
