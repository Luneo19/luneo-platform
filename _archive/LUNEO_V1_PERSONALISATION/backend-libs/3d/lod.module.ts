import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { LODService } from './lod.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { StorageModule } from '@/libs/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule, HttpModule, ConfigModule],
  providers: [LODService],
  exports: [LODService],
})
export class LODModule {}

































