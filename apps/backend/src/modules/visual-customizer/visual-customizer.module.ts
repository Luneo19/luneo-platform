import { Module } from '@nestjs/common';
import { VisualCustomizerController } from './controllers/visual-customizer.controller';
import { VisualCustomizerService } from './services/visual-customizer.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  controllers: [VisualCustomizerController],
  providers: [VisualCustomizerService],
  exports: [VisualCustomizerService],
})
export class VisualCustomizerModule {}
