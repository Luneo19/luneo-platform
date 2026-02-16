import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SharedGenerationService } from './shared-generation.service';
import { CollaborationController } from './collaboration.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CollaborationController],
  providers: [SharedGenerationService],
  exports: [SharedGenerationService],
})
export class CollaborationModule {}
