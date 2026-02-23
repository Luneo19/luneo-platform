import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { RbacModule } from './rbac.module';
import { AuditLogsService } from './services/audit-logs.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [RbacModule, PrismaModule, SmartCacheModule, AuthModule],
  controllers: [SecurityController],
  providers: [AuditLogsService, PermissionsGuard],
  exports: [RbacModule, AuditLogsService, PermissionsGuard],
})
export class SecurityModule {}
