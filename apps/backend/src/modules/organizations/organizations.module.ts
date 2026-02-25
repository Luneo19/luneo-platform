import { Module } from '@nestjs/common';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

/**
 * OrganizationsModule (renamed from BrandsModule for V2)
 * V2 note: internal symbols still use "brands" for backward compatibility.
 * Public API remains organization-oriented.
 */
@Module({
  imports: [PrismaOptimizedModule, SmartCacheModule],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class OrganizationsModule {}
