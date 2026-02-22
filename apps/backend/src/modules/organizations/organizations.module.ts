import { Module } from '@nestjs/common';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

/**
 * OrganizationsModule (renamed from BrandsModule for V2)
 * TODO: Rename all internal references from "brands" to "organizations"
 * when implementing the V2 schema (Etape 2)
 */
@Module({
  imports: [PrismaOptimizedModule, SmartCacheModule],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class OrganizationsModule {}
