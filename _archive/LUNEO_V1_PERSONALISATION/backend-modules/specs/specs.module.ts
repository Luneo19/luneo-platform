import { Module } from '@nestjs/common';
import { SpecsController } from './specs.controller';
import { SpecsService } from './specs.service';
import { SpecBuilderService } from './services/spec-builder.service';
import { SpecCanonicalizerService } from './services/spec-canonicalizer.service';
import { SpecHasherService } from './services/spec-hasher.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';

@Module({
  imports: [PrismaModule, SmartCacheModule, RedisOptimizedModule], // IdempotencyGuard, IdempotencyInterceptor need RedisOptimizedService
  controllers: [SpecsController],
  providers: [
    SpecsService,
    SpecBuilderService,
    SpecCanonicalizerService,
    SpecHasherService,
  ],
  exports: [SpecsService],
})
export class SpecsModule {}











