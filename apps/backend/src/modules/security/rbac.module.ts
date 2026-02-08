import { Module } from '@nestjs/common';
import { RBACService } from './services/rbac.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

/**
 * Standalone RBAC module so Auth and Security can use RBACService
 * without circular dependency (SecurityModule imports AuthModule).
 */
@Module({
  imports: [PrismaModule, SmartCacheModule],
  providers: [RBACService],
  exports: [RBACService],
})
export class RbacModule {}
