import { Module } from '@nestjs/common';
import { ManufacturingController } from './manufacturing.controller';
import { ManufacturingService } from './manufacturing.service';
import { ExportPackService } from './services/export-pack.service';
import { SvgGeneratorService } from './services/svg-generator.service';
import { DxfGeneratorService } from './services/dxf-generator.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, StorageModule, SmartCacheModule],
  controllers: [ManufacturingController],
  providers: [
    ManufacturingService,
    ExportPackService,
    SvgGeneratorService,
    DxfGeneratorService,
    PdfGeneratorService,
  ],
  exports: [ManufacturingService],
})
export class ManufacturingModule {}







