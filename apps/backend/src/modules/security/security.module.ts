import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { RbacModule } from './rbac.module';
import { AuditLogsService } from './services/audit-logs.service';
import { GDPRService } from './services/gdpr.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [RbacModule, PrismaModule, SmartCacheModule, AuthModule],
  controllers: [SecurityController],
  providers: [AuditLogsService, GDPRService, PermissionsGuard],
  exports: [RbacModule, AuditLogsService, GDPRService, PermissionsGuard],
})
export class SecurityModule {}

