import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MarketingRenderService } from '@/libs/3d/marketing-render.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { StorageModule } from '@/libs/storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 3,
    }),
  ],
  providers: [MarketingRenderService],
  exports: [MarketingRenderService],
})
export class MarketingRenderModule {}

































