import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { ModelTrainerService } from './model-trainer.service';
import { DatasetManagerService } from './dataset-manager.service';
import { FineTuningController } from './fine-tuning.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [FineTuningController],
  providers: [ModelTrainerService, DatasetManagerService],
  exports: [ModelTrainerService, DatasetManagerService],
})
export class FineTuningModule {}
