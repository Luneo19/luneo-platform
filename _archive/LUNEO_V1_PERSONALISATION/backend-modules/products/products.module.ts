import { Module, forwardRef } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsEnhancedService } from './services/products-enhanced.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { StorageModule } from '@/libs/storage/storage.module';
import { PlansModule } from '@/modules/plans/plans.module';

@Module({
  imports: [PrismaModule, StorageModule, forwardRef(() => PlansModule)],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsEnhancedService],
  exports: [ProductsService, ProductsEnhancedService],
})
export class ProductsModule {}
