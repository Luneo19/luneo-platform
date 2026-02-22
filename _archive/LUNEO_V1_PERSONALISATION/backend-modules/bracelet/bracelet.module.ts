import { Module } from '@nestjs/common';
import { BraceletController } from './bracelet.controller';
import { BraceletService } from './bracelet.service';
import { StorageModule } from '@/libs/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [BraceletController],
  providers: [BraceletService],
  exports: [BraceletService],
})
export class BraceletModule {}
