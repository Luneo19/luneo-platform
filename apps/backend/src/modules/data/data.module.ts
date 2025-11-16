import { Module } from '@nestjs/common';
import { DataController } from './data.controller';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [SecurityModule],
  controllers: [DataController],
  exports: [],
})
export class DataModule {}
