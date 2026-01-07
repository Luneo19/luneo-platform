import { Module } from '@nestjs/common';
import { MarketingRenderService } from './marketing-render.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { StorageModule } from '@/libs/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [MarketingRenderService],
  exports: [MarketingRenderService],
})
export class MarketingRenderModule {}
































