import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { BrandGuidelinesService } from './brand-guidelines.service';
import { StyleEnforcerService } from './style-enforcer.service';
import { ConsistencyCheckerService } from './consistency-checker.service';

@Module({
  imports: [PrismaModule],
  providers: [BrandGuidelinesService, StyleEnforcerService, ConsistencyCheckerService],
  exports: [BrandGuidelinesService, StyleEnforcerService, ConsistencyCheckerService],
})
export class BrandingModule {}
