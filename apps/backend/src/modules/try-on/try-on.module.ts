import { Module } from '@nestjs/common';
import { TryOnController } from './controllers/try-on.controller';
import { TryOnConfigurationService } from './services/try-on-configuration.service';
import { TryOnSessionService } from './services/try-on-session.service';
import { TryOnScreenshotService } from './services/try-on-screenshot.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { StorageModule } from '@/libs/storage/storage.module';

@Module({
  imports: [PrismaModule, SmartCacheModule, StorageModule],
  controllers: [TryOnController],
  providers: [
    TryOnConfigurationService,
    TryOnSessionService,
    TryOnScreenshotService,
  ],
  exports: [
    TryOnConfigurationService,
    TryOnSessionService,
    TryOnScreenshotService,
  ],
})
export class TryOnModule {}
