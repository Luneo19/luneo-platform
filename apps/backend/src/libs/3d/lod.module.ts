import { Module } from '@nestjs/common';
import { LODService } from './lod.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { StorageModule } from '@/libs/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [LODService],
  exports: [LODService],
})
export class LODModule {}

































