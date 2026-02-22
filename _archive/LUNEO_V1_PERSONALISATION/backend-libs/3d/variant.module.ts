import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { VariantService } from './variant.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, StorageModule, SmartCacheModule, HttpModule, ConfigModule],
  providers: [VariantService],
  exports: [VariantService],
})
export class VariantModule {}

































