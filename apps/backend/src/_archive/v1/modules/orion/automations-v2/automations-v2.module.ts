import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { AutomationsV2Service } from './automations-v2.service';
import { AutomationsV2Controller } from './automations-v2.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AutomationsV2Controller],
  providers: [AutomationsV2Service],
  exports: [AutomationsV2Service],
})
export class AutomationsV2Module {}
