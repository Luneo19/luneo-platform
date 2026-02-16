import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { VideoGeneratorService } from './video-generator.service';
import { MotionPresetsService } from './motion-presets.service';
import { VideoController } from './video.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [VideoController],
  providers: [VideoGeneratorService, MotionPresetsService],
  exports: [VideoGeneratorService, MotionPresetsService],
})
export class AnimationModule {}
