import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { PrivacyController } from './privacy.controller';
import { DataExportService } from './data-export.service';
import { DataDeletionService } from './data-deletion.service';
import { ConsentManagerService } from './consent-manager.service';
import { RetentionPolicyService } from './retention-policy.service';
import { DpaGeneratorService } from './dpa-generator.service';

@Module({
  imports: [PrismaOptimizedModule],
  controllers: [PrivacyController],
  providers: [
    DataExportService,
    DataDeletionService,
    ConsentManagerService,
    RetentionPolicyService,
    DpaGeneratorService,
  ],
  exports: [
    DataExportService,
    DataDeletionService,
    ConsentManagerService,
    RetentionPolicyService,
    DpaGeneratorService,
  ],
})
export class PrivacyModule {}
