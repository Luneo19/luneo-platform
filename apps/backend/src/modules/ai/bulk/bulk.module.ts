import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { BulkGeneratorService } from './bulk-generator.service';
import { CSVImportService } from './csv-import.service';
import { BulkController } from './bulk.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BulkController],
  providers: [BulkGeneratorService, CSVImportService],
  exports: [BulkGeneratorService, CSVImportService],
})
export class BulkModule {}
