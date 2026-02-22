import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { DesignsController } from '@/modules/designs/designs.controller';
import { ShareController } from '@/modules/designs/share.controller';
import { DesignCollectionsController } from '@/modules/designs/design-collections.controller';
import { DesignsService } from '@/modules/designs/designs.service';
import { DesignCollectionsService } from '@/modules/designs/services/design-collections.service';
import { DesignExportService } from '@/modules/design/services/design-export.service';
import { DESIGN_EXPORT_QUEUE } from '@/modules/design/services/design-export.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { PlansModule } from '@/modules/plans/plans.module';
import { UsageBillingModule } from '@/modules/usage-billing/usage-billing.module';
import { ZapierModule } from '@/modules/integrations/zapier/zapier.module';
import { CreditsModule } from '@/libs/credits/credits.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    StorageModule,
    forwardRef(() => PlansModule),
    UsageBillingModule,
    ZapierModule,
    CreditsModule,
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 3,
    }),
    BullModule.registerQueue(
      { name: 'ai-generation' },
      { name: DESIGN_EXPORT_QUEUE },
    ),
  ],
  controllers: [DesignsController, ShareController, DesignCollectionsController],
  providers: [DesignsService, DesignCollectionsService, DesignExportService],
  exports: [DesignsService, DesignCollectionsService, DesignExportService],
})
export class DesignsModule {}
