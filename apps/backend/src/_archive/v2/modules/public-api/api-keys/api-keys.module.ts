import { Module } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  providers: [ApiKeysService],
  controllers: [ApiKeysController],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}


