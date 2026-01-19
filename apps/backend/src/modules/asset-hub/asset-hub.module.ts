import { Module } from '@nestjs/common';
import { AssetHubController } from './controllers/asset-hub.controller';
import { AssetFileService } from './services/asset-file.service';
import { AssetFolderService } from './services/asset-folder.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { StorageModule } from '@/libs/storage/storage.module';

@Module({
  imports: [PrismaModule, SmartCacheModule, StorageModule],
  controllers: [AssetHubController],
  providers: [AssetFileService, AssetFolderService],
  exports: [AssetFileService, AssetFolderService],
})
export class AssetHubModule {}
