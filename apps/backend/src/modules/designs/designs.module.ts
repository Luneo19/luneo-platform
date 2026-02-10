import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { DesignsController } from '@/modules/designs/designs.controller';
import { ShareController } from '@/modules/designs/share.controller';
import { DesignCollectionsController } from '@/modules/designs/design-collections.controller';
import { DesignsService } from '@/modules/designs/designs.service';
import { DesignCollectionsService } from '@/modules/designs/services/design-collections.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { PlansModule } from '@/modules/plans/plans.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    forwardRef(() => PlansModule),
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 3,
    }),
    BullModule.registerQueue({
      name: 'ai-generation',
    }),
  ],
  controllers: [DesignsController, ShareController, DesignCollectionsController],
  providers: [DesignsService, DesignCollectionsService],
  exports: [DesignsService, DesignCollectionsService],
})
export class DesignsModule {}
