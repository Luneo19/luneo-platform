import { Module } from '@nestjs/common';
import { OrionController } from './orion.controller';
import { OrionService } from './orion.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SegmentsModule } from './segments/segments.module';
import { CommunicationsModule } from './communications/communications.module';
import { RetentionModule } from './retention/retention.module';
import { RevenueModule } from './revenue/revenue.module';
import { AdminToolsModule } from './admin-tools/admin-tools.module';
import { QuickWinsModule } from './quick-wins/quick-wins.module';
import { AutomationsModule } from './automations/automations.module';

@Module({
  imports: [
    PrismaModule,
    SegmentsModule,
    CommunicationsModule,
    RetentionModule,
    RevenueModule,
    AdminToolsModule,
    QuickWinsModule,
    AutomationsModule,
  ],
  controllers: [OrionController],
  providers: [OrionService],
  exports: [OrionService, SegmentsModule, RetentionModule, RevenueModule, QuickWinsModule, AutomationsModule],
})
export class OrionModule {}
